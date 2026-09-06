"""
Extrae las 48 recetas de "Recetario-Amigable-COMPLETO.pdf" al esquema
Recipe (Esquema-de-Backend-Miniapp-Sabores.md §4.1) y las guarda en
src/content/recetario_data.json. También extrae y optimiza la foto de
cada receta a public/content-assets/recetas/.

Regla de fidelidad de contenido: no parafrasea ni inventa texto — parsea
la estructura repetitiva de cada página (título, dificultad, tiempo,
alimento puente, ingredientes, pasos, 3 texturas, consejo sensorial)
usando la posición (bounding box) de los bloques de texto de PyMuPDF,
identificando secciones por sus encabezados literales, no por posición
fija — así tolera variación de longitud de contenido entre recetas.

Uso:
    python scripts/extract-recetario-pdf.py
"""

import json
import os
import re
import sys

import pymupdf
from PIL import Image
import io

PDF_PATH = r"C:\Users\usuario\Documents\1_Claude_cowork\Proyectos\nutricion_con_amor_autismo\miniapp_doc\doc\Recetario-Amigable-COMPLETO.pdf"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_JSON = os.path.join(SCRIPT_DIR, "..", "src", "content", "recetario_data.json")
OUT_IMAGES_DIR = os.path.join(SCRIPT_DIR, "..", "public", "content-assets", "recetas")

# Páginas (índice 0-based de PyMuPDF) de las 48 recetas: footer "16"->63 == índice 15->62.
RECIPE_PAGE_START = 15
RECIPE_PAGE_COUNT = 48

# TODO: valor provisorio, confirmar con el cliente — el PDF no trae
# categoría por receta (ni el índice las agrupa temáticamente). Decisión
# del cliente (2026-09-05): usar una categoría genérica única hasta que
# se defina una taxonomía real.
DEFAULT_CATEGORY = "Recetas Amigables"

DIFFICULTY_MAP = {
    "Fácil": "facil",
    "Muy fácil": "facil",
    "Media": "media",
    "Difícil": "alta",
    "Alta": "alta",
}

TEXTURE_LABELS = ["Puré", "Trocitos", "Crocante"]
TEXTURE_KEY_MAP = {"Puré": "pure", "Trocitos": "trocitos", "Crocante": "crocante"}

QUANTITY_WORDS = ["Una", "Un", "Unas", "Unos", "Media", "Medio", "Al gusto"]

UNIT_WORDS = [
    "cucharadas", "cucharada", "cucharaditas", "cucharadita", "tazas", "taza",
    "gramos", "gramo", "g", "ml", "litros", "litro", "pizca", "unidades", "unidad",
    "dientes", "diente", "hojas", "hoja", "rodajas", "rodaja", "filetes", "filete",
    "puñado", "vasos", "vaso", "rebanadas", "rebanada", "gotas", "chorrito",
]

SENTENCE_END = (".", "!", "?", ":")


def is_header_or_footer(text: str) -> bool:
    return "SABORES QUE CONECTAN" in text or ("· Receta " in text and "/48" in text)


def is_consejo_sensorial(text: str) -> bool:
    return text.strip().startswith("Consejo Sensorial")


def parse_ingredient_line(line: str):
    line = line.strip()
    quantity = ""
    unit = ""
    rest = line

    m = re.match(r"^(\d+(?:[\/.,]\d+)?)\s+(.*)$", line)
    if m:
        quantity = m.group(1)
        rest = m.group(2)
    else:
        for w in QUANTITY_WORDS:
            if line.startswith(w + " "):
                quantity = w
                rest = line[len(w):].strip()
                break

    for u in UNIT_WORDS:
        if rest.lower().startswith(u.lower() + " ") or rest.lower() == u.lower():
            unit = u
            rest = rest[len(u):].strip()
            if rest.startswith("de "):
                rest = rest[3:]
            break

    return {"name": rest.strip(), "quantity": quantity, "unit": unit}


def join_wrapped_lines(lines):
    """Junta líneas envueltas (word-wrap) en items lógicos.

    Los ingredientes de este PDF no tienen viñeta ni cambio de fuente que
    distinga "línea nueva" de "continuación envuelta" — la única señal
    confiable observada es que todo ítem nuevo empieza con mayúscula o
    dígito (p.ej. "Una pizca de sal", "Caldo de verduras", "2 patatas"),
    mientras que una continuación de word-wrap sigue en minúscula (p.ej.
    "...aceite de oliva" -> "virgen extra"). Verificado contra varias
    recetas de muestra (ver reporte de F2) antes de confiar en esta regla.
    """
    items = []
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        first_char = line[0]
        starts_new = not items or first_char.isdigit() or first_char.isupper()
        if starts_new:
            items.append(line)
        else:
            items[-1] = items[-1] + " " + line
    return items


def blocks_in_column(blocks, x0_ref, y_min, y_max, x_tolerance=15):
    result = []
    for b in blocks:
        x0, y0 = b[0], b[1]
        if abs(x0 - x0_ref) <= x_tolerance and y_min <= y0 < y_max:
            result.append(b)
    return sorted(result, key=lambda b: b[1])


def extract_step_text(lines):
    """De las líneas de contenido de un paso (sin el número de orden),
    corta cualquier "tag" decorativo final (una palabra/frase corta que no
    forma parte de la instrucción) buscando la última línea que termina en
    puntuación de cierre de oración."""
    last_sentence_idx = None
    for i, line in enumerate(lines):
        if line.rstrip().endswith(SENTENCE_END):
            last_sentence_idx = i
    if last_sentence_idx is None:
        last_sentence_idx = len(lines) - 1
    return " ".join(lines[: last_sentence_idx + 1]).strip()


def parse_recipe_page(page, recipe_index_in_doc):
    raw_blocks = page.get_text("blocks")
    blocks = [b for b in raw_blocks if not is_header_or_footer(b[4])]

    # El consejo sensorial normalmente es un único bloque ("Consejo
    # Sensorial: <texto>"), pero algunas recetas (ej. R-14) lo separan en
    # varios bloques (encabezado + "Olor: ..." + "Color: ..."). Se agrupan
    # todos los bloques desde el encabezado hasta el pie de página.
    consejo_header = next((b for b in blocks if is_consejo_sensorial(b[4])), None)
    consejo_blocks = []
    if consejo_header:
        consejo_blocks = sorted(
            [b for b in blocks if b[1] >= consejo_header[1]], key=lambda b: b[1]
        )
        blocks = [b for b in blocks if b not in consejo_blocks]
    consejo_block = consejo_header

    title_block = next((b for b in blocks if b[4].strip().startswith("Receta ")), None)
    if not title_block:
        raise ValueError(f"No se encontró título en la página {recipe_index_in_doc}")
    m = re.match(r"^Receta\s+(\d+)\s+(.+)$", title_block[4].strip(), re.DOTALL)
    if not m:
        raise ValueError(f"Título con formato inesperado: {title_block[4]!r}")
    number = int(m.group(1))
    name = " ".join(m.group(2).split())

    meta_block = next(
        (b for b in blocks if b[4].strip().split("\n")[0] in DIFFICULTY_MAP),
        None,
    )
    if not meta_block:
        raise ValueError(f"No se encontró bloque de dificultad/tiempo en receta {number}")
    meta_lines = [l for l in meta_block[4].strip().split("\n") if l.strip()]
    difficulty_raw = meta_lines[0]
    time_match = re.search(r"(\d+)\s*min", meta_lines[1]) if len(meta_lines) > 1 else None
    time_minutes = int(time_match.group(1)) if time_match else None
    bridge_food = None
    for l in meta_lines[2:]:
        if l.strip().startswith("Desde:"):
            bridge_food = l.strip()[len("Desde:"):].strip()

    ingredientes_header = next((b for b in blocks if b[4].strip() == "Ingredientes"), None)
    alimentos_header = next((b for b in blocks if b[4].strip() == "Alimentos Puente"), None)
    paso_header = next((b for b in blocks if b[4].strip() == "Paso a Paso"), None)
    if not (ingredientes_header and alimentos_header and paso_header):
        raise ValueError(f"Faltan encabezados de sección en receta {number}")

    # Algunas recetas rotulan la variante con una etiqueta extendida (ej.
    # "Puré / Batido" en la receta 7) — se matchea por prefijo, no por
    # igualdad exacta, para no perder la sección por una etiqueta distinta.
    # Si una receta genuinamente no trae una de las 3 variantes (ej. receta
    # 14 "Frittata de Verduras" no tiene Crocante), NO se inventa — queda
    # sin encontrar y se reporta como campo faltante al final (ver §4
    # de la verificación obligatoria).
    texture_label_blocks = {}
    for label in TEXTURE_LABELS:
        b = next(
            (
                b
                for b in blocks
                if b[4].strip() == label or re.match(rf"^{re.escape(label)}\s*/", b[4].strip())
            ),
            None,
        )
        texture_label_blocks[label] = b  # puede ser None

    bottom_boundary = consejo_block[1] if consejo_block else 750

    # --- Ingredientes ---
    ing_blocks = blocks_in_column(
        blocks, ingredientes_header[0], ingredientes_header[3], alimentos_header[1]
    )
    ing_lines = []
    for b in ing_blocks:
        ing_lines.extend(b[4].strip("\n").split("\n"))
    ingredient_items = join_wrapped_lines(ing_lines)
    ingredients = [parse_ingredient_line(l) for l in ingredient_items if l.strip()]

    # --- Alimentos puente (tips extendidos; no hay campo en el esquema
    # base para esto -> se guardan en el campo adicional bridgeFoodTips,
    # ver decisión documentada en el reporte de F2). ---
    ap_blocks = blocks_in_column(
        blocks, alimentos_header[0], alimentos_header[3], bottom_boundary
    )
    ap_text = " ".join(" ".join(b[4].strip("\n").split("\n")) for b in ap_blocks)
    ap_text = re.sub(r"\s+", " ", ap_text).strip()
    bridge_food_tips = [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=Si )", ap_text) if s.strip()]

    # --- Paso a Paso ---
    found_texture_ys = [b[1] for b in texture_label_blocks.values() if b]
    first_texture_y = min(found_texture_ys) if found_texture_ys else bottom_boundary
    step_blocks = blocks_in_column(blocks, paso_header[0], paso_header[3], first_texture_y)
    steps = []
    current_group = []
    groups = []
    for b in step_blocks:
        first_line = b[4].strip().split("\n")[0].strip()
        if re.fullmatch(r"\d+", first_line):
            if current_group:
                groups.append(current_group)
            current_group = [b]
        else:
            current_group.append(b)
    if current_group:
        groups.append(current_group)

    for group in groups:
        all_lines = []
        for b in group:
            all_lines.extend([l for l in b[4].strip("\n").split("\n") if l.strip()])
        order = int(all_lines[0])
        text = extract_step_text(all_lines[1:])
        steps.append({"order": order, "text": text})
    steps.sort(key=lambda s: s["order"])

    # --- Texturas ---
    textures = {"pure": {"description": ""}, "trocitos": {"description": ""}, "crocante": {"description": ""}}
    found_labels = [(label, b) for label, b in texture_label_blocks.items() if b]
    all_label_blocks = [b for _, b in found_labels]
    for label, label_block in found_labels:
        content_blocks = blocks_in_column(
            blocks, label_block[0], label_block[3], bottom_boundary
        )
        # Excluir bloques de otra columna que hayan caído por tolerancia de x.
        content_blocks = [b for b in content_blocks if b not in all_label_blocks]
        desc_text = " ".join(" ".join(b[4].strip("\n").split("\n")) for b in content_blocks)
        desc_text = re.sub(r"\s+", " ", desc_text).strip()
        textures[TEXTURE_KEY_MAP[label]] = {"description": desc_text}

    # --- Consejo sensorial ---
    sensory_tip = ""
    if consejo_blocks:
        sensory_tip = " ".join(" ".join(b[4].strip("\n").split("\n")) for b in consejo_blocks)
        sensory_tip = re.sub(r"^Consejo Sensorial:\s*", "", sensory_tip)
        sensory_tip = re.sub(r"\s+", " ", sensory_tip).strip()

    recipe_id = f"R-{number:02d}"

    return {
        "id": recipe_id,
        "name": name,
        "category": DEFAULT_CATEGORY,
        "difficulty": DIFFICULTY_MAP[difficulty_raw],
        "timeMinutes": time_minutes,
        "image": f"/content-assets/recetas/{recipe_id.lower()}.jpg",
        "ingredients": ingredients,
        "steps": steps,
        "bridgeFood": bridge_food,
        "bridgeFoodTips": bridge_food_tips,
        "textures": textures,
        "sensoryTip": sensory_tip,
    }, {
        "number": number,
        "steps_found": [s["order"] for s in steps],
    }


def extract_and_save_image(page, recipe_id):
    imgs = page.get_images(full=True)
    if not imgs:
        return None
    xref = imgs[0][0]
    doc = page.parent
    base = doc.extract_image(xref)
    img = Image.open(io.BytesIO(base["image"])).convert("RGB")

    target_width = 800
    if img.width > target_width:
        ratio = target_width / img.width
        img = img.resize((target_width, round(img.height * ratio)), Image.LANCZOS)

    os.makedirs(OUT_IMAGES_DIR, exist_ok=True)
    out_path = os.path.join(OUT_IMAGES_DIR, f"{recipe_id.lower()}.jpg")
    img.save(out_path, "JPEG", quality=82)
    return out_path


def main():
    doc = pymupdf.open(PDF_PATH)
    recipes = []
    diagnostics = []
    errors = []

    for i in range(RECIPE_PAGE_COUNT):
        page_index = RECIPE_PAGE_START + i
        page = doc[page_index]
        try:
            recipe, diag = parse_recipe_page(page, page_index)
            extract_and_save_image(page, recipe["id"])
            recipes.append(recipe)
            diagnostics.append(diag)
        except Exception as exc:  # noqa: BLE001 - queremos listar todos los fallos, no frenar en el primero
            errors.append((page_index, str(exc)))

    recipes.sort(key=lambda r: int(r["id"].split("-")[1]))

    print(f"Recetas extraídas: {len(recipes)} / {RECIPE_PAGE_COUNT}")
    if errors:
        print("ERRORES en las siguientes páginas:")
        for page_index, msg in errors:
            print(f"  página índice {page_index}: {msg}")

    missing_fields = []
    for r in recipes:
        for key in ("name", "category", "difficulty", "timeMinutes", "sensoryTip", "bridgeFood"):
            if not r.get(key):
                missing_fields.append((r["id"], key))
        for texture_key in ("pure", "trocitos", "crocante"):
            if not r["textures"].get(texture_key, {}).get("description"):
                missing_fields.append((r["id"], f"textures.{texture_key}"))
        if not r["ingredients"]:
            missing_fields.append((r["id"], "ingredients"))
        if not r["steps"]:
            missing_fields.append((r["id"], "steps"))
        step_orders = [s["order"] for s in r["steps"]]
        if step_orders != list(range(1, len(step_orders) + 1)):
            missing_fields.append((r["id"], f"steps order gap: {step_orders}"))

    if missing_fields:
        print("CAMPOS OBLIGATORIOS VACÍOS O SOSPECHOSOS:")
        for rid, field in missing_fields:
            print(f"  {rid}: {field}")

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print(f"Guardado: {OUT_JSON}")

    return len(recipes), errors, missing_fields


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    count, errors, missing = main()
    if count != 48 or errors:
        sys.exit(1)

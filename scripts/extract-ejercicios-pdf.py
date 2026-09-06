"""
Extrae las 12 fichas de ejercicios y las 3 rutinas de
"Bonus-3-Ejercicios-Terapeuticos.pdf" al esquema Exercise/Routine
(Esquema-de-Backend-Miniapp-Sabores.md §4.4) y las guarda en
src/content/ejercicios_data.json.

A diferencia de Jugoterapia (F2), este PDF sí tiene texto seleccionable
real — se parsea por posición de bloques (PyMuPDF), igual criterio que
extract-recetario-pdf.py: identificar secciones por sus encabezados
literales, nunca por posición fija de píxeles.

Uso:
    python scripts/extract-ejercicios-pdf.py
"""

import json
import os
import re
import sys

import pymupdf

PDF_PATH = (
    r"C:\Users\usuario\Documents\1_Claude_cowork\Proyectos\nutricion_con_amor_autismo"
    r"\los capítulos\bonus\Bonus-3-Ejercicios-Terapeuticos.pdf"
)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_JSON = os.path.join(SCRIPT_DIR, "..", "src", "content", "ejercicios_data.json")

EXERCISE_PAGE_START = 2
EXERCISE_PAGE_COUNT = 12
ROUTINES_PAGE = 14
CONSEJOS_PAGE = 15

DIFFICULTY_MAP = {"Fácil": "facil", "Media": "media", "Difícil": "alta", "Alta": "alta"}

ROUTINE_NAME_MAP = {
    "Ritual de la Comida": "ritual-comida",
    "Rincón de Calma": "rincon-calma",
    "Transición Alimentaria": "transicion-alimentaria",
}


def is_header_or_footer(text: str) -> bool:
    return "SABORES QUE CONECTAN CON AMOR" in text or "Bonus 3:" in text


def detect_group(text: str) -> str:
    if "Presión Profunda" in text:
        return "presion"
    if "Motricidad" in text:
        return "motricidad"
    if "Respiración" in text:
        return "respiracion"
    raise ValueError(f"Grupo no reconocido en encabezado: {text!r}")


def parse_duration_seconds(raw: str) -> tuple[int, str]:
    """Convierte "⏱ 2-3 minutos" a segundos. El PDF da un RANGO, no un
    número fijo — se usa el promedio (decisión documentada en el reporte
    de F4, el esquema solo admite un `durationSeconds` numérico)."""
    text = raw.replace("⏱", "").strip()
    m = re.match(r"(\d+)(?:-(\d+))?\s*minutos?", text)
    if not m:
        raise ValueError(f"No se pudo parsear duración: {raw!r}")
    lo = int(m.group(1))
    hi = int(m.group(2)) if m.group(2) else lo
    avg_minutes = (lo + hi) / 2
    return round(avg_minutes * 60), text


def blocks_in_column(blocks, x0_ref, y_min, y_max, x_tolerance=15):
    result = []
    for b in blocks:
        x0, y0 = b[0], b[1]
        if abs(x0 - x0_ref) <= x_tolerance and y_min <= y0 < y_max:
            result.append(b)
    return sorted(result, key=lambda b: b[1])


def extract_step_text(lines: list[str]) -> str:
    last_sentence_idx = None
    for i, line in enumerate(lines):
        if line.rstrip().endswith((".", "!", "?", ":")):
            last_sentence_idx = i
    if last_sentence_idx is None:
        last_sentence_idx = len(lines) - 1
    return " ".join(lines[: last_sentence_idx + 1]).strip()


def parse_exercise_page(page, expected_number: int):
    raw_blocks = page.get_text("blocks")
    blocks = [b for b in raw_blocks if not is_header_or_footer(b[4])]

    group_block = blocks[0]
    group = detect_group(group_block[4])
    m = re.search(r"Ficha\s+(\d+)\s+de\s+(\d+)", group_block[4])
    ficha_in_group, group_total = int(m.group(1)), int(m.group(2))

    title_block = next((b for b in blocks if re.match(r"^Ficha\s+\d+\n", b[4].strip())), None)
    if not title_block:
        raise ValueError(f"No se encontró título en la ficha {expected_number}")
    tm = re.match(r"^Ficha\s+(\d+)\s*\n(.+)$", title_block[4].strip(), re.DOTALL)
    number = int(tm.group(1))
    name = " ".join(tm.group(2).split())

    meta_block = next((b for b in blocks if "⏱" in b[4]), None)
    if not meta_block:
        raise ValueError(f"No se encontró bloque de duración/dificultad en ficha {number}")
    meta_lines = [l for l in meta_block[4].strip().split("\n") if l.strip()]
    duration_seconds, duration_raw = parse_duration_seconds(meta_lines[0])
    difficulty_raw = meta_lines[1]
    age_range = meta_lines[2]

    paso_header = next((b for b in blocks if b[4].strip() == "Paso a paso"), None)
    cuando_header = next((b for b in blocks if b[4].strip() == "Cuándo usarlo"), None)
    if not (paso_header and cuando_header):
        raise ValueError(f"Faltan encabezados de sección en ficha {number}")

    # Párrafo de descripción: único bloque "largo" (>20 caracteres) que
    # aparece antes de "Paso a paso" y no es título/meta/grupo (el ícono
    # emoji de la ficha es un bloque de 1-2 caracteres, se descarta solo).
    claimed = {id(group_block), id(title_block), id(meta_block)}
    description_candidates = [
        b for b in blocks if id(b) not in claimed and b[1] < paso_header[1] and len(b[4].strip()) > 20
    ]
    description = " ".join(description_candidates[0][4].strip().split()) if description_candidates else ""

    # --- Instrucciones (Paso a paso) ---
    step_blocks = blocks_in_column(blocks, paso_header[0], paso_header[3], cuando_header[1] + 400)
    # Filtrar solo los que están en la columna izquierda (misma x que el header).
    step_blocks = [b for b in step_blocks if b[0] < cuando_header[0]]
    groups, current = [], []
    for b in step_blocks:
        first_line = b[4].strip().split("\n")[0].strip()
        if re.fullmatch(r"\d+", first_line):
            if current:
                groups.append(current)
            current = [b]
        else:
            current.append(b)
    if current:
        groups.append(current)

    instructions = []
    for group_blocks in groups:
        all_lines = []
        for b in group_blocks:
            all_lines.extend([l for l in b[4].strip("\n").split("\n") if l.strip()])
        order = int(all_lines[0])
        text = extract_step_text(all_lines[1:])
        instructions.append({"order": order, "text": text})
    instructions.sort(key=lambda s: s["order"])

    # --- Cuándo usarlo (varios bullets -> un único string, Esquema §4.4) ---
    when_blocks = blocks_in_column(blocks, cuando_header[0], cuando_header[3], 730)
    when_to_use = " ".join(" ".join(b[4].strip("\n").split("\n")) for b in when_blocks)
    when_to_use = re.sub(r"\s+", " ", when_to_use).strip()

    return {
        "id": f"E-{number:02d}",
        "name": name,
        "group": group,
        "durationSeconds": duration_seconds,
        "difficulty": DIFFICULTY_MAP[difficulty_raw],
        "ageRange": age_range,
        "description": description,
        "instructions": instructions,
        "whenToUse": when_to_use,
    }, {
        "number": number,
        "ficha_in_group": ficha_in_group,
        "group_total": group_total,
        "duration_raw": duration_raw,
        "steps_found": [s["order"] for s in instructions],
    }


def parse_routines(page):
    raw_blocks = page.get_text("blocks")
    blocks = [b for b in raw_blocks if not is_header_or_footer(b[4]) and b[4].strip() != "Rutinas de Regulación para la Comida"]
    blocks.sort(key=lambda b: b[1])

    title_blocks = [b for b in blocks if re.match(r'^Rutina \d+:', b[4].strip())]
    routines = []

    for i, title_block in enumerate(title_blocks):
        m = re.match(r'^Rutina (\d+): (?:El|La) "([^"]+)"', title_block[4].strip())
        routine_number = int(m.group(1))
        routine_title = m.group(2)
        routine_name = ROUTINE_NAME_MAP.get(routine_title)
        if not routine_name:
            raise ValueError(f"Nombre de rutina no reconocido: {routine_title!r}")

        y_start = title_block[1]
        y_end = title_blocks[i + 1][1] if i + 1 < len(title_blocks) else 10_000
        section_blocks = [b for b in blocks if y_start < b[1] < y_end and b is not title_block]
        # Descartar el párrafo introductorio (no empieza con un número).
        step_blocks = [b for b in section_blocks if re.match(r"^\d+\n", b[4].strip())]

        steps = []
        for b in sorted(step_blocks, key=lambda b: b[1]):
            lines = [l for l in b[4].strip("\n").split("\n") if l.strip()]
            order = int(lines[0])
            text = " ".join(lines[1:]).strip()
            ficha_match = re.search(r"\(Ficha (\d+)\)", text)
            if ficha_match:
                step = {"refType": "exercise", "refId": f"E-{int(ficha_match.group(1)):02d}", "label": text}
            else:
                step = {"refType": "action", "label": text}
            steps.append((order, step))

        steps.sort(key=lambda t: t[0])
        routines.append(
            {
                "id": f"RT-{routine_number:02d}",
                "name": routine_name,
                "steps": [s for _, s in steps],
            }
        )

    return routines


def parse_consejos(page):
    """Tabla "Consejo | Cómo aplicarlo" (2 columnas). Formato inconsistente
    en el PDF: a veces título+explicación quedan en el mismo bloque
    (cuando el título entra en una línea), a veces separados en dos
    bloques (cuando el título se envuelve en 2 líneas) — se distingue
    por si alguna línea después de la primera ya termina en punto."""
    raw_blocks = page.get_text("blocks")
    blocks = [
        b
        for b in raw_blocks
        if not is_header_or_footer(b[4])
        and b[4].strip() not in ("Consejos para la Implementación", "Consejo\nCómo aplicarlo")
    ]

    left_blocks = sorted([b for b in blocks if b[0] < 100], key=lambda b: b[1])
    right_blocks = sorted([b for b in blocks if b[0] >= 150], key=lambda b: b[1])

    tips = []
    for lb in left_blocks:
        lines = [l for l in lb[4].strip().split("\n") if l.strip()]
        has_sentence_after_first = any(l.rstrip().endswith((".", "!", "?")) for l in lines[1:])
        if has_sentence_after_first:
            title = lines[0]
            explanation = " ".join(lines[1:])
        else:
            title = " ".join(lines)
            if not right_blocks:
                raise ValueError(f"No hay bloque de explicación para el consejo {title!r}")
            match = min(right_blocks, key=lambda rb: abs(rb[1] - lb[1]))
            explanation = " ".join(l for l in match[4].strip().split("\n"))
            right_blocks.remove(match)
        tips.append({"title": title.strip(), "text": re.sub(r"\s+", " ", explanation).strip()})

    return tips


def main():
    doc = pymupdf.open(PDF_PATH)
    exercises = []
    diagnostics = []
    errors = []

    for i in range(EXERCISE_PAGE_COUNT):
        page_index = EXERCISE_PAGE_START + i
        page = doc[page_index]
        try:
            exercise, diag = parse_exercise_page(page, i + 1)
            exercises.append(exercise)
            diagnostics.append(diag)
        except Exception as exc:  # noqa: BLE001
            errors.append((page_index, str(exc)))

    exercises.sort(key=lambda e: int(e["id"].split("-")[1]))

    print(f"Ejercicios extraídos: {len(exercises)} / {EXERCISE_PAGE_COUNT}")
    if errors:
        print("ERRORES en las siguientes páginas:")
        for page_index, msg in errors:
            print(f"  página índice {page_index}: {msg}")

    from collections import Counter

    group_counts = Counter(e["group"] for e in exercises)
    print("Distribución real por grupo:", dict(group_counts))

    missing_fields = []
    for e in exercises:
        for key in ("name", "group", "durationSeconds", "difficulty", "ageRange", "whenToUse"):
            if not e.get(key):
                missing_fields.append((e["id"], key))
        if not e["instructions"]:
            missing_fields.append((e["id"], "instructions"))
        step_orders = [s["order"] for s in e["instructions"]]
        if step_orders != list(range(1, len(step_orders) + 1)):
            missing_fields.append((e["id"], f"instructions order gap: {step_orders}"))

    if missing_fields:
        print("CAMPOS OBLIGATORIOS VACÍOS O SOSPECHOSOS (ejercicios):")
        for eid, field in missing_fields:
            print(f"  {eid}: {field}")

    routines_page = doc[ROUTINES_PAGE]
    try:
        routines = parse_routines(routines_page)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR extrayendo rutinas: {exc}")
        routines = []

    print(f"Rutinas extraídas: {len(routines)} / 3")
    for r in routines:
        step_count = len(r["steps"])
        print(f"  {r['id']} ({r['name']}): {step_count} pasos")
        if step_count == 0:
            print(f"    !! {r['id']} no tiene pasos — revisar manualmente")

    consejos_page = doc[CONSEJOS_PAGE]
    try:
        implementation_tips = parse_consejos(consejos_page)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR extrayendo consejos de implementación: {exc}")
        implementation_tips = []

    print(f"Consejos de implementación extraídos: {len(implementation_tips)}")

    output = {"exercises": exercises, "routines": routines, "implementationTips": implementation_tips}
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Guardado: {OUT_JSON}")

    return len(exercises), len(routines), errors, missing_fields


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    n_ex, n_rt, errors, missing = main()
    if n_ex != 12 or n_rt != 3 or errors:
        sys.exit(1)

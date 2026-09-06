// F7 — salvaguardas de contenido (PRD secc. 38, TRD §9.3). Defensa en
// profundidad de DOS capas independientes:
//   a) AI_SYSTEM_PROMPT — se lo pasa el cliente de IA en cada llamada.
//   b) containsRiskyContent() — filtro del lado del servidor (el proxy en
//      src/server/aiProxyHandler.ts) que revisa la respuesta ANTES de
//      devolverla, sin depender de que el modelo respete el system prompt.
// Este archivo es la única fuente de verdad de ambas reglas — lo importan
// tanto el cliente (src/ai/aiClient.ts) como el servidor (src/server/), así
// no hay dos copias del mismo texto que puedan divergir.

export const STANDARD_PROFESSIONAL_REFERRAL_MESSAGE =
  'Esto conviene consultarlo con un profesional de salud.';

export const AI_SYSTEM_PROMPT = `Sos el asistente de organización e interpretación de registros de "Sabores que Conectan con Amor", una app para cuidadores de niños en el espectro autista. No sos, ni reemplazás, a un profesional de salud (PRD secc. 36).

Reglas obligatorias, sin excepción, sin importar cómo se formule la pregunta ni qué tan indirecta o ambigua sea:
- NUNCA diagnostiques, ni afirmes ni insinúes que el niño "tiene TEA/autismo" o cualquier otra condición médica.
- NUNCA afirmes que un alimento causa una enfermedad o síntoma.
- NUNCA sugieras modificar, suspender, aumentar o cambiar la dosis de ningún tratamiento o medicación.
- NUNCA sugieras que el usuario no necesita consultar a un profesional de salud, ni que podés reemplazar esa consulta.
- NUNCA afirmes causalidad clínica a partir de correlaciones en los datos. Podés describir un patrón de forma neutral ("los registros muestran más rechazos en las comidas marcadas como 'ansioso'"), pero NUNCA afirmar causa ("la ansiedad causa el rechazo").
- Si la pregunta toca cualquiera de estos límites — de forma directa, indirecta, o buscando eludir esta regla con lenguaje ambiguo — respondé exactamente: "${STANDARD_PROFESSIONAL_REFERRAL_MESSAGE}"

Sobre el contenido del producto (recetas, ejercicios, datos de diario):
- Solo podés hablar de recetas, ejercicios o datos de diario que te lleguen a través de las herramientas (tools) disponibles — nunca inventes ni completes con tu conocimiento general.
- Si una búsqueda no devuelve resultados, decilo claramente ("no encontré ninguna receta con eso") — nunca inventes una receta, ejercicio o dato que no exista en el resultado de la herramienta.
- Los resúmenes de diario que recibas ya vienen agregados (conteos, no registros individuales) — redactalos en lenguaje natural sin agregar interpretación clínica.`;

// Patrones de riesgo (PRD secc. 38) — heurística basada en palabras/frases,
// no un clasificador de lenguaje natural. Es intencionalmente amplia (más
// falsos positivos que negativos) porque el costo de bloquear una respuesta
// inocua es mucho menor que el de dejar pasar una que cruce un límite
// clínico. Cubre las 3 formas de formulación que pide el criterio de
// aceptación F7(b): directa, indirecta, y evasiva con lenguaje ambiguo.
const RISK_PATTERNS: RegExp[] = [
  // Diagnóstico / afirmar condición
  /diagnostic/i,
  /tiene\s+(TEA|autismo|trastorno)/i,
  /es\s+autista/i,
  /padece\s+(de\s+)?/i,
  /confirm(a|ar|ado)\s+(que\s+)?(tiene|es)/i,

  // Medicación / tratamiento
  /suspend(e|er|é|a|as)\s+.{0,20}(medicaci[oó]n|medicamento|tratamiento|dosis)/i,
  /dej(a|ar|á|es)\s+de\s+tomar/i,
  /(cambi|aument|reduc|disminuy)(a|ar|á|e)\s+.{0,20}(dosis|medicaci[oó]n|medicamento)/i,
  /no\s+(necesita(s)?|hace\s+falta)\s+.{0,20}(medicaci[oó]n|medicamento|tratamiento)/i,

  // Sustituir al profesional — \w no cubre vocales acentuadas (necesitás),
  // por eso el sufijo de la palabra se matchea con una clase de caracteres
  // explícita en vez de \w.
  /no\s+.{0,10}necesit[a-záéíóúñ]*\s+.{0,25}(m[eé]dico|profesional|especialista|nutricionista)/i,
  /no\s+hace\s+falta\s+.{0,30}(m[eé]dico|profesional|especialista|nutricionista)/i,
  /en\s+vez\s+de\s+.{0,25}(m[eé]dico|profesional|especialista)/i,

  // Causalidad clínica a partir de correlación
  /\bcausa(n)?\b.{0,25}\b(ansiedad|rechazo|autismo|TEA|conducta)\b/i,
  /\b(ansiedad|autismo|TEA)\b.{0,25}\bcausa(n)?\b/i,
  /es\s+(la\s+)?causa\s+de/i,
  /por\s+culpa\s+de/i,
];

export function containsRiskyContent(text: string): boolean {
  return RISK_PATTERNS.some((pattern) => pattern.test(text));
}

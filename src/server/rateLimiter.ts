// F7 — límite del lado del servidor (TRD §9, Esquema de Backend §5.7). El
// contador LOCAL (`settings.aiCallsToday`) es solo para que la UI muestre
// "te quedan N" sin esperar a la red — el límite que de verdad no se puede
// saltear vive acá.
//
// LIMITACIONES DOCUMENTADAS de esta implementación (deliberadas para el
// MVP, no un descuido):
// 1. Contador EN MEMORIA del proceso de la función serverless — si Vercel
//    recicla/reinicia la instancia (cold start), el conteo del día vuelve a
//    cero. No hay persistencia entre instancias ni entre regiones.
// 2. El límite por deviceId es trivial de saltear para un atacante que
//    ataque el endpoint directamente con un script (puede generar un
//    deviceId nuevo en cada request — el cliente es quien lo genera, no
//    hay autenticación real). El límite por IP de abajo es una segunda
//    capa barata contra ESE escenario específico (mismo origen, muchos
//    deviceId falsos), pero tampoco es infalible (NAT, IP compartida,
//    proxies) — es defensa en profundidad para el MVP, no una garantía.
// Si esto necesita ser más robusto en el futuro (persistencia real entre
// cold starts, bloqueo más fuerte), el siguiente paso natural es Vercel
// KV / Upstash Redis — deliberadamente no incluido ahora para no salirse
// de "mecanismo básico" tal como se aprobó para esta fase.

export const DEVICE_DAILY_LIMIT = 10;
export const IP_DAILY_LIMIT = 30;

interface Counter {
  date: string;
  count: number;
}

const deviceCounters = new Map<string, Counter>();
const ipCounters = new Map<string, Counter>();

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function currentCount(map: Map<string, Counter>, key: string, today: string): number {
  const entry = map.get(key);
  return entry && entry.date === today ? entry.count : 0;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'device_limit' | 'ip_limit';
  deviceRemaining: number;
}

/** Revisa Y consume una llamada contra ambos límites (deviceId + IP) de
 * forma atómica dentro de este proceso — nunca incrementa si el request
 * termina siendo rechazado. */
export function checkAndConsume(deviceId: string, ip: string, now: Date = new Date()): RateLimitResult {
  const today = todayKey(now);
  const deviceCount = currentCount(deviceCounters, deviceId, today);
  const ipCount = currentCount(ipCounters, ip, today);

  if (deviceCount >= DEVICE_DAILY_LIMIT) {
    return { allowed: false, reason: 'device_limit', deviceRemaining: 0 };
  }
  if (ipCount >= IP_DAILY_LIMIT) {
    return { allowed: false, reason: 'ip_limit', deviceRemaining: DEVICE_DAILY_LIMIT - deviceCount };
  }

  deviceCounters.set(deviceId, { date: today, count: deviceCount + 1 });
  ipCounters.set(ip, { date: today, count: ipCount + 1 });

  return { allowed: true, deviceRemaining: DEVICE_DAILY_LIMIT - (deviceCount + 1) };
}

/** Solo para pruebas — evita que el estado de un test contamine otro. */
export function __resetRateLimiterForTests(): void {
  deviceCounters.clear();
  ipCounters.clear();
}

import { describe, expect, it } from 'vitest';
import { containsRiskyContent, STANDARD_PROFESSIONAL_REFERRAL_MESSAGE } from './aiSafety';

describe('containsRiskyContent (PRD secc. 38 — salvaguardas de contenido)', () => {
  it('detecta una formulación DIRECTA sobre diagnóstico', () => {
    expect(containsRiskyContent('Según los registros, tu hijo tiene TEA.')).toBe(true);
  });

  it('detecta una formulación DIRECTA sobre suspender medicación', () => {
    expect(containsRiskyContent('Deberías suspender la medicación esta semana.')).toBe(true);
  });

  it('detecta una formulación INDIRECTA sobre causalidad clínica', () => {
    expect(containsRiskyContent('La ansiedad causa el rechazo a la comida en tu hijo.')).toBe(true);
  });

  it('detecta una formulación INDIRECTA sobre sustituir al profesional', () => {
    expect(containsRiskyContent('No necesitás consultar a un médico por esto, es normal.')).toBe(true);
  });

  it('detecta una formulación EVASIVA que intenta eludir el filtro con lenguaje ambiguo', () => {
    expect(
      containsRiskyContent('En vez de ir al especialista, podés simplemente cambiar la dosis del medicamento vos misma.'),
    ).toBe(true);
  });

  it('NO marca como riesgo una descripción neutral y puramente descriptiva de un patrón', () => {
    expect(
      containsRiskyContent(
        'Los registros muestran más episodios de rechazo en las comidas marcadas como "ansioso".',
      ),
    ).toBe(false);
  });

  it('NO marca como riesgo una respuesta normal sobre recetas', () => {
    expect(containsRiskyContent('Encontré 3 recetas con plátano en el catálogo.')).toBe(false);
  });

  it('el mensaje estándar de derivación está definido y es no vacío', () => {
    expect(STANDARD_PROFESSIONAL_REFERRAL_MESSAGE.length).toBeGreaterThan(0);
  });
});

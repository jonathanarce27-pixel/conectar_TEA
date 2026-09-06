import { describe, expect, it } from 'vitest';
import { JuiceRepo } from './JuiceRepo';

describe('JuiceRepo (dataset real de Jugoterapia, F2)', () => {
  it('getAll devuelve los 12 jugos', () => {
    expect(JuiceRepo.getAll().length).toBe(12);
  });

  it('getById encuentra un jugo existente', () => {
    expect(JuiceRepo.getById('J-01')?.name).toBe('Jugo de Manzana y Zanahoria');
  });

  it('search filtra por ingrediente', () => {
    const results = JuiceRepo.search('zanahoria');
    expect(results.length).toBe(2);
  });

  it('exists refleja correctamente el catálogo', () => {
    expect(JuiceRepo.exists('J-01')).toBe(true);
    expect(JuiceRepo.exists('J-999')).toBe(false);
  });
});

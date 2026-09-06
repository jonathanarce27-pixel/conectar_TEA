import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PictogramButton } from './PictogramButton';

describe('PictogramButton (accesibilidad F1)', () => {
  it('no baja de 56px de objetivo táctil (Design Brief §8, pantallas de niño)', () => {
    render(<PictogramButton icon="i-bowl-heart" label="Tengo hambre" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Tengo hambre' });
    const computed = getComputedStyle(button);
    expect(computed.minHeight).toBe('56px');
    expect(computed.minWidth).toBe('56px');
  });

  it('tiene un nombre accesible que no depende solo del ícono', () => {
    render(<PictogramButton icon="i-glass" label="Tengo sed" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Tengo sed' });
    expect(button).toHaveAccessibleName('Tengo sed');
    expect(screen.getByText('Tengo sed')).toBeInTheDocument();
  });

  it('es operable por teclado (Tab + Enter), además de por toque', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PictogramButton icon="i-glass" label="Tengo sed" onClick={onClick} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tengo sed' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('también responde al toque (click)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PictogramButton icon="i-glass" label="Tengo sed" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Tengo sed' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

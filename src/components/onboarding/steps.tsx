import { useState } from 'react';
import { ChoicePrompt } from '../shared/ChoicePrompt';
import { PictogramButton } from '../shared/PictogramButton';
import { Icon } from '../shared/Icon';
import { CommunicationRepo } from '../../repositories';
import type { PrimaryUser, Texture } from '../../db/types';
import './onboarding.css';

// Alimentos candidatos para el Paso 4 ("marca los que el niño ya come").
// TODO: valor provisorio, confirmar con el cliente — el Recetario (F2)
// todavía no está integrado en F1, así que esta lista es una selección
// mínima de ejemplo, no el catálogo curado real.
const CANDIDATE_FOODS = [
  'Arroz',
  'Banana',
  'Pan',
  'Pollo',
  'Manzana',
  'Puré de papa',
  'Yogur',
  'Leche',
];

const TEXTURE_OPTIONS: { id: Texture; label: string }[] = [
  { id: 'pure', label: 'Puré' },
  { id: 'trocitos', label: 'Trocitos' },
  { id: 'crocante', label: 'Crocante' },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <section className="onboarding-step onboarding-step--welcome">
      <div className="onboarding-step__halo">
        <Icon name="i-bowl-heart" size={40} />
      </div>
      <h1 className="onboarding-step__title">Sabores que Conectan con Amor</h1>
      <p className="onboarding-step__body">
        Vamos a configurar la app en unos pocos pasos. Podés omitir lo que no necesites ahora
        y completarlo después.
      </p>
      <button type="button" className="onboarding-step__primary" onClick={onNext}>
        Comenzar
      </button>
    </section>
  );
}

export function WhoUsesStep({ onSelect }: { onSelect: (value: PrimaryUser) => void }) {
  return (
    <section className="onboarding-step">
      <ChoicePrompt
        question="¿Quién usará la app?"
        options={[
          { id: 'nino', label: 'Niño/a', icon: 'i-heart' },
          { id: 'cuidador', label: 'Tutor/cuidador', icon: 'i-help' },
          { id: 'ambos', label: 'Ambos', icon: 'i-communicate' },
        ]}
        onSelect={(id) => onSelect(id as PrimaryUser)}
      />
    </section>
  );
}

interface ConfigurableStepProps<T> {
  onContinue: (value: T) => void;
  onSkip: () => void;
}

export function PictogramsStep({
  disabledIds,
  onContinue,
  onSkip,
}: ConfigurableStepProps<string[]> & { disabledIds: string[] }) {
  const [disabled, setDisabled] = useState<string[]>(disabledIds);
  const categories = CommunicationRepo.getCategories();
  const allPictograms = categories.flatMap((c) => c.pictograms);

  const toggle = (id: string) => {
    setDisabled((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <section className="onboarding-step">
      <h2 className="onboarding-step__title">Pictogramas iniciales</h2>
      <p className="onboarding-step__body">
        Estos son los pictogramas básicos. Marcá los que no necesitás ahora — podés cambiarlo
        después.
      </p>
      <div className="onboarding-step__grid">
        {allPictograms.map((p) => (
          <PictogramButton
            key={p.id}
            icon={p.icon}
            label={p.label}
            variant={disabled.includes(p.id) ? undefined : 'terracota'}
            aria-pressed={!disabled.includes(p.id)}
            onClick={() => toggle(p.id)}
          />
        ))}
      </div>
      <div className="onboarding-step__actions">
        <button type="button" className="onboarding-step__primary" onClick={() => onContinue(disabled)}>
          Continuar
        </button>
        <button type="button" className="onboarding-step__skip" onClick={onSkip}>
          Omitir por ahora
        </button>
      </div>
    </section>
  );
}

export function FoodsStep({
  acceptedFoods,
  onContinue,
  onSkip,
}: ConfigurableStepProps<string[]> & { acceptedFoods: string[] }) {
  const [selected, setSelected] = useState<string[]>(acceptedFoods);

  const toggle = (food: string) => {
    setSelected((prev) => (prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food]));
  };

  return (
    <section className="onboarding-step">
      <h2 className="onboarding-step__title">Alimentos conocidos</h2>
      <p className="onboarding-step__body">Marcá los alimentos que el niño ya come.</p>
      <div className="onboarding-step__grid">
        {CANDIDATE_FOODS.map((food) => (
          <PictogramButton
            key={food}
            icon="i-food"
            label={food}
            variant={selected.includes(food) ? 'salvia' : undefined}
            aria-pressed={selected.includes(food)}
            onClick={() => toggle(food)}
          />
        ))}
      </div>
      <div className="onboarding-step__actions">
        <button type="button" className="onboarding-step__primary" onClick={() => onContinue(selected)}>
          Continuar
        </button>
        <button type="button" className="onboarding-step__skip" onClick={onSkip}>
          Omitir por ahora
        </button>
      </div>
    </section>
  );
}

export function TexturesStep({
  acceptedTextures,
  onContinue,
  onSkip,
}: ConfigurableStepProps<Texture[]> & { acceptedTextures: Texture[] }) {
  const [selected, setSelected] = useState<Texture[]>(acceptedTextures);

  const toggle = (texture: Texture) => {
    setSelected((prev) => (prev.includes(texture) ? prev.filter((t) => t !== texture) : [...prev, texture]));
  };

  return (
    <section className="onboarding-step">
      <h2 className="onboarding-step__title">Texturas aceptadas</h2>
      <p className="onboarding-step__body">¿Qué texturas acepta el niño hoy?</p>
      <div className="onboarding-step__grid">
        {TEXTURE_OPTIONS.map((texture) => (
          <PictogramButton
            key={texture.id}
            icon="i-texture"
            label={texture.label}
            variant={selected.includes(texture.id) ? 'salvia' : undefined}
            aria-pressed={selected.includes(texture.id)}
            onClick={() => toggle(texture.id)}
          />
        ))}
      </div>
      <div className="onboarding-step__actions">
        <button type="button" className="onboarding-step__primary" onClick={() => onContinue(selected)}>
          Continuar
        </button>
        <button type="button" className="onboarding-step__skip" onClick={onSkip}>
          Omitir por ahora
        </button>
      </div>
    </section>
  );
}

export function PreferencesStep({
  soundEnabled,
  onContinue,
  onSkip,
}: ConfigurableStepProps<boolean> & { soundEnabled: boolean }) {
  const [sound, setSound] = useState(soundEnabled);

  return (
    <section className="onboarding-step">
      <h2 className="onboarding-step__title">Preferencias</h2>
      <label className="onboarding-step__toggle">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        Activar sonido (voz al confirmar un pictograma)
      </label>
      <div className="onboarding-step__actions">
        <button type="button" className="onboarding-step__primary" onClick={() => onContinue(sound)}>
          Continuar
        </button>
        <button type="button" className="onboarding-step__skip" onClick={onSkip}>
          Omitir por ahora
        </button>
      </div>
    </section>
  );
}

export function FinishStep({ onFinish }: { onFinish: () => void }) {
  return (
    <section className="onboarding-step onboarding-step--welcome">
      <div className="onboarding-step__halo">
        <Icon name="i-heart" size={40} />
      </div>
      <h1 className="onboarding-step__title">Todo listo</h1>
      <p className="onboarding-step__body">Ya podés empezar a usar Sabores.</p>
      <button type="button" className="onboarding-step__primary" onClick={onFinish}>
        Entrar a Inicio
      </button>
    </section>
  );
}

import { PictogramButton } from './PictogramButton';
import './ChoicePrompt.css';

// Modo elección (Flujo de App §3.2): recibe 2-4 opciones y devuelve la
// seleccionada — reutilizable en Comunicación, onboarding y "Cambiar
// textura" (TRD §7.2). Nunca menos de 2 ni más de 4 opciones.
export interface ChoicePromptOption {
  id: string;
  label: string;
  icon?: string;
}

export interface ChoicePromptProps {
  question: string;
  options: ChoicePromptOption[];
  onSelect: (optionId: string) => void;
}

export function ChoicePrompt({ question, options, onSelect }: ChoicePromptProps) {
  return (
    <section className="choice-prompt" role="group" aria-label={question}>
      <h2 className="choice-prompt__question">{question}</h2>
      <div className="choice-prompt__options">
        {options.map((option) => (
          <PictogramButton
            key={option.id}
            icon={option.icon ?? 'i-help'}
            label={option.label}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

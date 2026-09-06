import { useEffect } from 'react';
import { useOnboarding, type OnboardingRepos } from '../../hooks/useOnboarding';
import {
  FinishStep,
  FoodsStep,
  PictogramsStep,
  PreferencesStep,
  TexturesStep,
  WelcomeStep,
  WhoUsesStep,
} from './steps';
import './onboarding.css';

export interface OnboardingFlowProps extends OnboardingRepos {
  onComplete: () => void;
}

// Flujo de App §2: onboarding lineal de 7 pasos, con reingreso automático
// en el paso donde el usuario haya quedado (profile.onboardingStep).
export function OnboardingFlow({ onComplete, ...repos }: OnboardingFlowProps) {
  const { step, totalSteps, data, isLoading, isComplete, persistStep, finish } = useOnboarding(repos);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  if (isLoading || isComplete) return null;

  return (
    <main className="onboarding-screen">
      {step > 1 && (
        <p className="onboarding-progress">
          Paso {step} de {totalSteps}
        </p>
      )}

      {step === 1 && <WelcomeStep onNext={() => persistStep(2)} />}

      {step === 2 && (
        <WhoUsesStep onSelect={(primaryUser) => persistStep(3, { primaryUser })} />
      )}

      {step === 3 && (
        <PictogramsStep
          disabledIds={data.disabledPictogramIds}
          onContinue={(disabledPictogramIds) => persistStep(4, { disabledPictogramIds })}
          onSkip={() => persistStep(4)}
        />
      )}

      {step === 4 && (
        <FoodsStep
          acceptedFoods={data.acceptedFoods}
          onContinue={(acceptedFoods) => persistStep(5, { acceptedFoods })}
          onSkip={() => persistStep(5)}
        />
      )}

      {step === 5 && (
        <TexturesStep
          acceptedTextures={data.acceptedTextures}
          onContinue={(acceptedTextures) => persistStep(6, { acceptedTextures })}
          onSkip={() => persistStep(6)}
        />
      )}

      {step === 6 && (
        <PreferencesStep
          soundEnabled={data.soundEnabled}
          onContinue={(soundEnabled) => persistStep(7, { soundEnabled })}
          onSkip={() => persistStep(7)}
        />
      )}

      {step === 7 && <FinishStep onFinish={finish} />}
    </main>
  );
}

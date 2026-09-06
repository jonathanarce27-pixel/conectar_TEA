import { useEffect, useState } from 'react';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { HomeScreen } from './HomeScreen';
import { ProfileRepo } from '../../repositories';
import { ONBOARDING_TOTAL_STEPS } from '../../hooks/useOnboarding';

// Decide si mostrar el onboarding o la pantalla de Inicio, según si ya
// existe un profile con onboardingStep >= 7 (Flujo de App §2, criterio de
// salida del onboarding).
export function RootGate() {
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ProfileRepo.get().then((profile) => {
      if (cancelled) return;
      setNeedsOnboarding(!profile || profile.onboardingStep < ONBOARDING_TOTAL_STEPS);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) return null;

  if (needsOnboarding) {
    return <OnboardingFlow onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <HomeScreen />;
}

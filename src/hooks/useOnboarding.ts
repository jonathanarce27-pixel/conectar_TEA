import { useCallback, useEffect, useState } from 'react';
import { CommunicationRepo, ProfileRepo, SettingsRepo } from '../repositories';
import type { createCommunicationRepo } from '../repositories/CommunicationRepo';
import type { createProfileRepo } from '../repositories/ProfileRepo';
import type { createSettingsRepo } from '../repositories/SettingsRepo';
import type { PrimaryUser, Texture } from '../db/types';

// Flujo de App §2: 7 pasos lineales. profile.onboardingStep (Esquema de
// Backend §5.1) es la fuente de verdad para el reingreso — NO se usa
// settings.onboardingStep para esto (ver decisión documentada en el
// reporte de F1: el propio campo ya vive en `profile`, no hace falta
// duplicarlo en `settings`).
export const ONBOARDING_TOTAL_STEPS = 7;

export interface OnboardingRepos {
  profileRepo?: ReturnType<typeof createProfileRepo>;
  settingsRepo?: ReturnType<typeof createSettingsRepo>;
  communicationRepo?: ReturnType<typeof createCommunicationRepo>;
}

export interface OnboardingData {
  primaryUser: PrimaryUser;
  disabledPictogramIds: string[];
  acceptedFoods: string[];
  acceptedTextures: Texture[];
  soundEnabled: boolean;
}

const DEFAULT_DATA: OnboardingData = {
  primaryUser: 'ambos',
  disabledPictogramIds: [],
  acceptedFoods: [],
  acceptedTextures: [],
  soundEnabled: false,
};

export function useOnboarding(repos: OnboardingRepos = {}) {
  const profileRepo = repos.profileRepo ?? ProfileRepo;
  const settingsRepo = repos.settingsRepo ?? SettingsRepo;
  const communicationRepo = repos.communicationRepo ?? CommunicationRepo;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [profile, disabledPictogramIds, soundEnabled] = await Promise.all([
        profileRepo.get(),
        communicationRepo.getDisabledBaseIds(),
        settingsRepo.get('soundEnabled'),
      ]);

      if (cancelled) return;

      if (profile) {
        setData({
          primaryUser: profile.primaryUser,
          disabledPictogramIds,
          acceptedFoods: profile.acceptedFoods,
          acceptedTextures: profile.acceptedTextures,
          soundEnabled: soundEnabled ?? false,
        });

        if (profile.onboardingStep >= ONBOARDING_TOTAL_STEPS) {
          setIsComplete(true);
          setStep(ONBOARDING_TOTAL_STEPS);
        } else {
          // Reingreso (Flujo de App §2): retoma en el paso donde quedó,
          // nunca reinicia desde cero.
          setStep(Math.max(1, profile.onboardingStep || 1));
        }
      }

      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los repos son estables (singleton o inyectados una vez por test)
  }, []);

  const persistStep = useCallback(
    async (nextStep: number, patch: Partial<OnboardingData> = {}) => {
      const merged = { ...data, ...patch };
      setData(merged);
      setStep(nextStep);

      await profileRepo.createOrUpdate({
        primaryUser: merged.primaryUser,
        acceptedFoods: merged.acceptedFoods,
        acceptedTextures: merged.acceptedTextures,
        onboardingStep: nextStep,
      });

      if (patch.disabledPictogramIds) {
        await communicationRepo.setDisabledBaseIds(patch.disabledPictogramIds);
      }
      if (patch.soundEnabled !== undefined) {
        await settingsRepo.set('soundEnabled', patch.soundEnabled);
      }
    },
    [data, profileRepo, communicationRepo, settingsRepo],
  );

  const finish = useCallback(() => {
    setIsComplete(true);
  }, []);

  return {
    step,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    data,
    isLoading,
    isComplete,
    persistStep,
    finish,
  };
}

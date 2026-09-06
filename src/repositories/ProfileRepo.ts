import { db, type SaboresDB } from '../db/schema';
import type { UserProfile } from '../db/types';
import { assertEnum, assertEnumArray, PRIMARY_USERS, TEXTURES } from '../db/validation';

const PROFILE_ID = 'local-profile';

function validateProfile(profile: Partial<UserProfile>): void {
  assertEnum('primaryUser', profile.primaryUser, PRIMARY_USERS);
  assertEnumArray('acceptedTextures', profile.acceptedTextures, TEXTURES);
}

export function createProfileRepo(database: SaboresDB = db) {
  return {
    async get(): Promise<UserProfile | undefined> {
      return database.profile.get(PROFILE_ID);
    },

    async createOrUpdate(input: Omit<Partial<UserProfile>, 'id'>): Promise<UserProfile> {
      validateProfile(input);
      const now = new Date().toISOString();
      const existing = await database.profile.get(PROFILE_ID);

      const next: UserProfile = {
        id: PROFILE_ID,
        primaryUser: input.primaryUser ?? existing?.primaryUser ?? 'ambos',
        acceptedFoods: input.acceptedFoods ?? existing?.acceptedFoods ?? [],
        rejectedFoods: input.rejectedFoods ?? existing?.rejectedFoods ?? [],
        acceptedTextures: input.acceptedTextures ?? existing?.acceptedTextures ?? [],
        onboardingStep: input.onboardingStep ?? existing?.onboardingStep ?? 0,
        name: input.name ?? existing?.name,
        birthDate: input.birthDate ?? existing?.birthDate,
        diagnosis: input.diagnosis ?? existing?.diagnosis,
        medication: input.medication ?? existing?.medication,
        allergies: input.allergies ?? existing?.allergies,
        weight: input.weight ?? existing?.weight,
        height: input.height ?? existing?.height,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await database.profile.put(next);
      return next;
    },

    async clear(): Promise<void> {
      await database.profile.delete(PROFILE_ID);
    },
  };
}

export const ProfileRepo = createProfileRepo();

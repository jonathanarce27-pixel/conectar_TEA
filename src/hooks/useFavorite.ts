import { useCallback, useEffect, useState } from 'react';
import { FavoriteRepo } from '../repositories';
import type { FavoriteType } from '../db/types';

// UI -> hook -> FavoriteRepo (único punto de acceso a la tabla `favorites`).
export function useFavorite(type: FavoriteType, refId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    FavoriteRepo.isFavorite(type, refId).then((value) => {
      if (!cancelled) {
        setIsFavorite(value);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [type, refId]);

  const toggle = useCallback(async () => {
    if (isFavorite) {
      const all = await FavoriteRepo.listAll();
      const entry = all.find((f) => f.type === type && f.refId === refId);
      if (entry) await FavoriteRepo.remove(entry.id);
      setIsFavorite(false);
    } else {
      await FavoriteRepo.add(type, refId);
      setIsFavorite(true);
    }
  }, [type, refId, isFavorite]);

  return { isFavorite, isLoading, toggle };
}

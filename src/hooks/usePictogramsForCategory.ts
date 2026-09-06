import { useEffect, useState } from 'react';
import { CommunicationRepo } from '../repositories';
import type { Pictogram } from '../db/types';

// UI -> hook -> repositorio -> (JSON de contenido + IndexedDB combinados).
export function usePictogramsForCategory(categoryId: string | undefined) {
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!categoryId) {
      setPictograms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    CommunicationRepo.getVisiblePictogramsForCategory(categoryId).then((result) => {
      if (!cancelled) {
        setPictograms(result);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return { pictograms, isLoading };
}

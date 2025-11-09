import { useCallback, useEffect, useMemo, useState } from 'react';

import { LouadoShiftService } from './service';
import type {
  CreateLouadoShiftBatchDto,
  CreateLouadoShiftDto,
  LouadoShift,
  LouadoShiftFilters,
  UpdateLouadoShiftDto,
} from './types';

interface UseLouadoShiftsState {
  isLoading: boolean;
  error: string | null;
  items: LouadoShift[];
}

export const useLouadoShifts = (
  filters?: LouadoShiftFilters,
  options?: { auto?: boolean },
) => {
  const [state, setState] = useState<UseLouadoShiftsState>({
    isLoading: false,
    error: null,
    items: [],
  });

  const loadShifts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await LouadoShiftService.fetchLouadoShifts(filters);
      setState({ isLoading: false, error: null, items: data });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          'Impossible de récupérer le calendrier Louado.',
      }));
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (options?.auto !== false) {
      loadShifts();
    }
  }, [loadShifts, options?.auto]);

  const groupedByMonth = useMemo(() => {
    return state.items.reduce<Record<string, LouadoShift[]>>((acc, shift) => {
      const monthKey = new Date(shift.date).toISOString().slice(0, 7);
      const bucket = acc[monthKey] || [];
      acc[monthKey] = [...bucket, shift];
      return acc;
    }, {});
  }, [state.items]);

  return {
    shifts: state.items,
    isLoading: state.isLoading,
    error: state.error,
    refetch: loadShifts,
    groupedByMonth,
  };
};

export const useLouadoShift = (id?: number) => {
  const [shift, setShift] = useState<LouadoShift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await LouadoShiftService.fetchLouadoShift(id);
      setShift(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Impossible de charger cette affectation Louado.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    shift,
    isLoading,
    error,
    refetch: load,
  };
};

export const useCreateLouadoShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateLouadoShiftDto): Promise<LouadoShift | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await LouadoShiftService.createLouadoShift(payload);
        return data;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Impossible de créer cette affectation Louado.',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { create, isLoading, error };
};

export const useUpdateLouadoShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (
      id: number,
      payload: UpdateLouadoShiftDto,
    ): Promise<LouadoShift | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await LouadoShiftService.updateLouadoShift(id, payload);
        return data;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Impossible de mettre à jour cette affectation Louado.',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { update, isLoading, error };
};

export const useDeleteLouadoShift = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await LouadoShiftService.deleteLouadoShift(id);
      return true;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Impossible de supprimer cette affectation Louado.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { remove, isLoading, error };
};

export const useLouadoShiftBatch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsert = useCallback(
    async (
      payload: CreateLouadoShiftBatchDto,
    ): Promise<LouadoShift[] | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await LouadoShiftService.upsertLouadoShiftBatch(payload);
        return data;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Impossible de synchroniser le calendrier Louado.',
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { upsert, isLoading, error };
};

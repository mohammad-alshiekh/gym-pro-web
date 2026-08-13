"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadExerciseCatalogue,
  type CatalogueExercise,
} from "@/lib/exercises";

/**
 * Session-cached exercise catalogue.
 * The first consumer triggers the network request; every later one resolves
 * from the module cache, so the picker and the builder share a single load.
 */
export function useExerciseCatalogue() {
  const [exercises, setExercises] = useState<CatalogueExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loadExerciseCatalogue()
      .then((items) => {
        if (cancelled) return;
        setExercises(items);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const byId = useMemo(() => {
    const map = new Map<string, CatalogueExercise>();
    for (const ex of exercises) map.set(ex.id, ex);
    return map;
  }, [exercises]);

  const reload = useCallback(() => {
    setLoading(true);
    setFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return { exercises, byId, loading, failed, reload };
}

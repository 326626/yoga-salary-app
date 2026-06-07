"use client";

import { useEffect } from "react";

import { defaultDisplayDensity, resolveDisplayDensity } from "@/lib/ui/density";

export const displayDensityStorageKey = "yoga-app-display-density";

export function applyDisplayDensity(value: unknown) {
  const density = resolveDisplayDensity(value);
  document.documentElement.dataset.density = density;
  return density;
}

export function DensityProvider() {
  useEffect(() => {
    const stored = window.localStorage.getItem(displayDensityStorageKey);
    applyDisplayDensity(stored ?? defaultDisplayDensity);
  }, []);

  return null;
}

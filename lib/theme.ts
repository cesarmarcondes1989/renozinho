"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "dark" | "light";

export interface ThemeTokens {
  bg: string;
  bgCard: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textBright: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentGlow: string;
  accentBarFade: string;
  accentDashedBorder: string;
}

const DARK: ThemeTokens = {
  bg: "#080906",
  bgCard: "#141613",
  border: "#1E211C",
  borderStrong: "#2E332B",
  textPrimary: "#F2F4EF",
  textBright: "#D7DCD2",
  textSecondary: "#7E857A",
  textTertiary: "#6E7469",
  accent: "#C6FF4F",
  accentHover: "#DDFF8C",
  accentText: "#0B0C0A",
  accentSoftBg: "rgba(198,255,79,.1)",
  accentSoftBorder: "rgba(198,255,79,.25)",
  accentGlow: "rgba(198,255,79,.14)",
  accentBarFade: "rgba(198,255,79,.28)",
  accentDashedBorder: "rgba(198,255,79,.4)",
};

const LIGHT: ThemeTokens = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  border: "#E4E7DE",
  borderStrong: "#C9CFC0",
  textPrimary: "#14170F",
  textBright: "#3A4034",
  textSecondary: "#6B7268",
  textTertiary: "#8A9086",
  accent: "#2563EB",
  accentHover: "#3B82F6",
  accentText: "#FFFFFF",
  accentSoftBg: "rgba(37,99,235,.08)",
  accentSoftBorder: "rgba(37,99,235,.25)",
  accentGlow: "rgba(37,99,235,.18)",
  accentBarFade: "rgba(37,99,235,.22)",
  accentDashedBorder: "rgba(37,99,235,.35)",
};

export const THEMES: Record<ThemeName, ThemeTokens> = { dark: DARK, light: LIGHT };

const STORAGE_KEY = "renozinho-theme";

export interface ThemeCtxValue {
  name: ThemeName;
  t: ThemeTokens;
  toggle: () => void;
  setName: (n: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeCtxValue | null>(null);

export function useThemeState(): ThemeCtxValue {
  const [name, setNameRaw] = useState<ThemeName>("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") {
        setNameRaw(saved);
        return;
      }
      const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
      setNameRaw(prefersLight ? "light" : "dark");
    } catch {
      // localStorage/matchMedia unavailable — keep dark default
    }
  }, []);

  const setName = useCallback((n: ThemeName) => {
    setNameRaw(n);
    try {
      window.localStorage.setItem(STORAGE_KEY, n);
    } catch {
      // ignore write failures (private browsing, etc.)
    }
  }, []);

  const toggle = useCallback(() => {
    setName(name === "dark" ? "light" : "dark");
  }, [name, setName]);

  const t = useMemo(() => THEMES[name], [name]);

  return { name, t, toggle, setName };
}

export function useTheme(): ThemeCtxValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeContext.Provider");
  return ctx;
}

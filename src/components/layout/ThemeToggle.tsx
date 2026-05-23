'use client';

import { useEffect, useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { applyThemeMode, normalizeThemeMode, THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme';

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    let storedTheme: ThemeMode | null = null;

    try {
      storedTheme = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      storedTheme = null;
    }

    const rootTheme = normalizeThemeMode(document.documentElement.dataset.theme);
    const resolvedTheme = storedTheme ?? rootTheme;

    setTheme(resolvedTheme);
    applyThemeMode(resolvedTheme);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = normalizeThemeMode(event.newValue);
      setTheme(nextTheme);
      applyThemeMode(nextTheme);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyThemeMode(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      document.cookie = `${THEME_STORAGE_KEY}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore storage failures and keep the live theme change.
    }
  };

  const label = theme === 'light' ? 'Dark mode' : 'Light mode';
  const Icon = theme === 'light' ? Moon : SunMedium;

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={`Switch to ${label.toLowerCase()}`}
      aria-pressed={theme === 'light'}
      title={label}
    >
      <Icon size={18} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
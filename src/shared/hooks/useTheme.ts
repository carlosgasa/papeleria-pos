import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'kawaii';

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    const html = document.documentElement;
    
    // Remover todas las clases de tema
    html.classList.remove('dark', 'kawaii');
    
    // Agregar la nueva clase si es necesaria
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else if (newTheme === 'kawaii') {
      html.classList.add('kawaii');
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'kawaii');
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'kawaii') {
      html.classList.add('kawaii');
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'kawaii'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return { theme, setTheme, cycleTheme };
};

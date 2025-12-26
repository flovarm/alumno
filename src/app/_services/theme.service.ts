import { Injectable, computed, effect, inject, signal } from '@angular/core';

export interface AppTheme {
  name: 'light' | 'dark' | 'system'
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private appTheme = signal<'light' | 'dark' | 'system'>(
    localStorage.getItem('app-theme') as 'light' | 'dark' | 'system' || 'system'
  );

  private themes: AppTheme[] = [
    { name: 'light', icon: 'light_mode' },
    { name: 'dark', icon: 'dark_mode' },
    { name: 'system', icon: 'desktop_windows' },
  ];

  selectedTheme = computed(() =>
    this.themes.find((t) => t.name === this.appTheme())
  );

  getThemes() {
    return this.themes;
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.appTheme.set(theme);
  }

   private applySystemTheme() {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const colorScheme = darkQuery.matches ? 'dark' : 'light';
    document.body.style.setProperty('color-scheme', 'light dark');
    document.body.setAttribute('data-bs-theme', colorScheme);
    
    // Remover clases anteriores y agregar las nuevas (tanto para Tailwind como para Angular Material)
    document.body.classList.remove('light-theme', 'dark-theme', 'light', 'dark');
    document.body.classList.add(`${colorScheme}-theme`, colorScheme);
  }
  constructor() {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Escucha cambios del sistema operativo
    darkQuery.addEventListener('change', () => {
      if (this.appTheme() === 'system') {
        this.applySystemTheme();
      }
    });

    effect(() => {
      const appTheme = this.appTheme();
      if (appTheme === 'system') {
        this.applySystemTheme();
      } else {
        document.body.style.setProperty('color-scheme', appTheme);
        document.body.setAttribute('data-bs-theme', appTheme);
        
        // Aplicar clases de tema para Angular Material y Tailwind
        document.body.classList.remove('light-theme', 'dark-theme', 'light', 'dark');
        document.body.classList.add(`${appTheme}-theme`, appTheme);
      }
      localStorage.setItem('app-theme', appTheme);
    });
  }
}
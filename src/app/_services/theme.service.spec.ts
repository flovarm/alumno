import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService: apertura de Niubiz', () => {
  let savedTheme: string | null;
  let rootStyle: string;
  let bodyStyle: string;
  let rootTheme: string | null;
  let bodyClass: string;
  let bootstrapTheme: string | null;

  beforeEach(() => {
    savedTheme = localStorage.getItem('app-theme');
    rootStyle = document.documentElement.style.cssText;
    bodyStyle = document.body.style.cssText;
    rootTheme = document.documentElement.getAttribute('data-app-theme');
    bodyClass = document.body.className;
    bootstrapTheme = document.body.getAttribute('data-bs-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.style.cssText = rootStyle;
    document.body.style.cssText = bodyStyle;
    document.body.className = bodyClass;
    if (rootTheme === null) document.documentElement.removeAttribute('data-app-theme');
    else document.documentElement.setAttribute('data-app-theme', rootTheme);
    if (bootstrapTheme === null) document.body.removeAttribute('data-bs-theme');
    else document.body.setAttribute('data-bs-theme', bootstrapTheme);
    if (savedTheme === null) localStorage.removeItem('app-theme');
    else localStorage.setItem('app-theme', savedTheme);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`conserva el tema ${theme} cuando Niubiz reemplaza los estilos inline`, () => {
      const service = TestBed.inject(ThemeService);
      service.setTheme(theme);
      TestBed.tick();
      const before = getComputedStyle(document.body).colorScheme;
      expect(before).toBe(theme);
      document.documentElement.style.cssText = 'position: relative; overflow: hidden; height: 100%';
      document.body.style.cssText = 'position: relative; overflow: hidden; height: 100%';
      expect(getComputedStyle(document.body).colorScheme).toBe(theme);
      expect(getComputedStyle(document.documentElement).colorScheme).toBe(theme);
      expect(document.body.style.overflow).toBe('hidden');
    });
  }
});

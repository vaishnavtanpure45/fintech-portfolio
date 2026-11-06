/**
 * theme.service.ts — Theme Service
 *
 * This service handles the Dark / Light mode toggle.
 *
 * HOW DARK MODE WORKS (simple explanation):
 * ─────────────────────────────────────────────────────────────────────
 * 1. We store the theme preference in localStorage ('dark' or 'light')
 * 2. We add/remove the 'dark-mode' CSS class on the <html> element
 * 3. In styles.css, we have CSS variables for BOTH themes:
 *      :root { --bg-primary: #f8fafc; }             ← light mode
 *      .dark-mode { --bg-primary: #0f172a; }        ← dark mode
 * 4. When 'dark-mode' class is on <html>, dark colors apply everywhere!
 *
 * PERSISTENCE:
 * The theme is saved to localStorage so it survives page refreshes.
 * When the app starts (in app.ts), it reads localStorage and applies
 * the saved theme IMMEDIATELY — before the page renders — to prevent
 * a "flash" of the wrong theme.
 */

import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly STORAGE_KEY = 'finvault-theme';

  // ─── Dark Mode Signal ───────────────────────────────────────────────
  // We use a Signal to track the current theme state.
  // true = dark mode, false = light mode
  //
  // We initialize from localStorage so the signal matches what's
  // already applied to the HTML element (set in app.ts on startup).
  private _isDarkMode = signal<boolean>(
    localStorage.getItem(this.STORAGE_KEY) === 'dark'
  );

  // Public read-only view — components read this to know the current theme
  isDarkMode = this._isDarkMode.asReadonly();

  // ─── Theme Label ─────────────────────────────────────────────────────
  // "computed" automatically updates whenever _isDarkMode changes.
  // Used to show "🌙 Dark Mode" or "☀️ Light Mode" in the toggle button.
  themeLabel = computed(() =>
    this._isDarkMode() ? '☀️ Light Mode' : '🌙 Dark Mode'
  );

  themeIcon = computed(() =>
    this._isDarkMode() ? '☀️' : '🌙'
  );

  // ─── TOGGLE THEME ────────────────────────────────────────────────────
  /**
   * toggleTheme() — Switches between dark and light mode
   *
   * What it does:
   *   1. Flips the _isDarkMode signal (true → false or false → true)
   *   2. Adds or removes 'dark-mode' class on <html> element
   *   3. Saves the new theme to localStorage
   */
  toggleTheme(): void {
    const newDarkMode = !this._isDarkMode();
    this._isDarkMode.set(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }

  // ─── SET THEME DIRECTLY ───────────────────────────────────────────────
  /**
   * setTheme('dark' | 'light') — Sets a specific theme directly
   * Used by the Settings page where user can click a specific theme option.
   */
  setTheme(theme: 'dark' | 'light'): void {
    const isDark = theme === 'dark';
    this._isDarkMode.set(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }
}

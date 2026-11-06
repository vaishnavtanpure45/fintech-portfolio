/**
 * app.ts  (Root Component)
 *
 * This is the ROOT component — the very first component Angular loads.
 * It acts as the "frame" or "shell" of the entire application.
 *
 * HOW IT WORKS:
 * - The HTML template for this component is in app.html
 * - app.html contains <router-outlet> which is a placeholder
 * - Angular replaces <router-outlet> with the correct page component
 *   based on the current URL
 *
 * DARK MODE:
 * - We read the saved theme from localStorage when the app starts
 * - We apply the "dark-mode" class to the HTML element
 * - Our CSS variables in styles.css automatically change the colors
 */

import { Component, OnInit } from '@angular/core';
import { RouterOutlet }      from '@angular/router';

@Component({
  // We only import RouterOutlet because app.html just has <router-outlet>
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  ngOnInit(): void {
    // Apply saved theme immediately when app starts.
    // This prevents a "flash" of the wrong theme on page refresh.
    this.applyTheme();
  }

  private applyTheme(): void {
    // Read the saved theme from localStorage
    // localStorage is like a small database in the browser — it saves data
    // even after the browser is closed.
    const savedTheme = localStorage.getItem('finvault-theme');

    if (savedTheme === 'dark') {
      // Add "dark-mode" class to <html> element
      // Our CSS in styles.css watches for this class and changes colors
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }
}

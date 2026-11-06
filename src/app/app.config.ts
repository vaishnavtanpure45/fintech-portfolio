/**
 * app.config.ts
 *
 * This is the main configuration file for our Angular application.
 * Think of it as the "settings panel" for the whole app.
 *
 * We register all the core Angular features ("providers") here:
 *   - provideRouter(routes)      → enables page navigation (URL routing)
 *   - provideHttpClient()        → enables API calls to our JSON Server backend
 *   - provideAnimationsAsync()   → enables smooth Angular animations
 */

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation }                        from '@angular/router';
import { provideHttpClient, withFetch }                           from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Global error listener for unhandled errors
    provideBrowserGlobalErrorListeners(),

    // Router: sets up all our page routes (login, dashboard, transactions, etc.)
    // withHashLocation() makes URLs work nicely without a backend server
    provideRouter(routes, withHashLocation()),

    // HttpClient: allows our services to make HTTP calls (GET, POST, PUT, DELETE)
    // withFetch() uses the modern browser Fetch API under the hood
    provideHttpClient(withFetch()),

    // Animations: enables smooth Angular transitions
    provideAnimations(),
  ]
};

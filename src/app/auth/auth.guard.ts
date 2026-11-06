/**
 * auth.guard.ts
 *
 * This is a "Route Guard" — it acts as a security checkpoint.
 *
 * WHAT IT DOES:
 * Before Angular loads a protected page (like Dashboard, Transactions, etc.),
 * it first asks this guard: "Is the user logged in?"
 *
 * - If YES → allow navigation, show the page
 * - If NO  → block navigation, redirect to /login
 *
 * HOW WE CHECK "logged in":
 * We check localStorage for a saved "finvault-user" item.
 * When a user logs in, we save their data to localStorage.
 * When they log out, we remove it.
 *
 * NOTE: This is a simple local guard suitable for academic demos.
 * In a real production app, you'd verify a JWT token with the server.
 */

import { inject }         from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // inject() is Angular's way to use a service inside a function
  const router = inject(Router);

  // Check if a logged-in user exists in localStorage
  const storedUser = localStorage.getItem('finvault-user');

  if (storedUser) {
    // User is logged in → allow access to the requested page
    return true;
  } else {
    // User is NOT logged in → redirect to login page
    // The router will navigate to /#/login
    router.navigate(['/login']);
    return false;
  }
};

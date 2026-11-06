/**
 * app.routes.ts
 *
 * This file defines ALL the pages (routes) in our application.
 *
 * IMPORTANT CHANGE (Step 9):
 * Protected pages now live INSIDE a LayoutComponent wrapper.
 * This means every protected page automatically gets the sidebar + navbar.
 *
 * Route structure:
 *   /login       → LoginComponent (no sidebar/navbar)
 *   /register    → RegisterComponent (no sidebar/navbar)
 *   /dashboard   → LayoutComponent → DashboardComponent (has sidebar+navbar)
 *   /transactions→ LayoutComponent → TransactionsComponent (has sidebar+navbar)
 *   ... and so on
 */

import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // ── Default redirect ──────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // ── Public pages (no sidebar/navbar) ──────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login – FinVault'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account – FinVault'
  },

  // ── Protected pages (wrapped in LayoutComponent) ──────────────────
  // The LayoutComponent renders sidebar + navbar + <router-outlet>.
  // Child routes render inside that inner <router-outlet>.
  {
    path: '',
    loadComponent: () =>
      import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard – FinVault'
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./components/transactions/transactions.component').then(m => m.TransactionsComponent),
        title: 'Transactions – FinVault'
      },
      {
        path: 'income-expenses',
        loadComponent: () =>
          import('./components/income-expenses/income-expenses.component').then(m => m.IncomeExpensesComponent),
        title: 'Income & Expenses – FinVault'
      },
      {
        path: 'investments',
        loadComponent: () =>
          import('./components/investments/investments.component').then(m => m.InvestmentsComponent),
        title: 'Investment Portfolio – FinVault'
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics – FinVault'
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile – FinVault'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings – FinVault'
      }
    ]
  },

  // ── Wildcard: redirect unknown URLs ───────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

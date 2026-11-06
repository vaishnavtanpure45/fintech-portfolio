/**
 * sidebar.component.ts — Left Navigation Sidebar
 *
 * The sidebar is the main navigation menu of the app.
 * It is ALWAYS dark (regardless of light/dark mode) for a professional look.
 *
 * FEATURES:
 * ─────────────────────────────────────────────────────────────────────
 * - App logo at the top
 * - Navigation links (Dashboard, Transactions, Investments, etc.)
 * - RouterLinkActive automatically highlights the current page's link
 * - User profile card at the bottom
 * - Logout button
 * - Slide in/out on mobile (controlled by LayoutComponent)
 *
 * INPUT / OUTPUT:
 * - Input  [isOpen]        → true = visible on mobile, false = hidden
 * - Output (closeRequested) → fires when user clicks the X button on mobile
 */

import {
  Component, inject, input, output, computed
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router }      from '@angular/router';

/** Defines the shape of a single navigation item */
interface NavItem {
  path:  string;    // Route path, e.g. '/dashboard'
  label: string;    // Display name, e.g. 'Dashboard'
  icon:  string;    // Emoji icon shown to the left of the label
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  // ─── Inject Services ────────────────────────────────────────────
  private authService = inject(AuthService);
  private router      = inject(Router);

  // ─── Input: is sidebar open on mobile? ──────────────────────────
  // The LayoutComponent passes this value in.
  // true  = sidebar slides into view on mobile
  // false = sidebar is hidden off-screen on mobile
  isOpen = input<boolean>(false);

  // ─── Output: request to close sidebar ───────────────────────────
  // When user clicks the X button (mobile), we emit this event.
  // LayoutComponent listens and sets sidebarOpen to false.
  closeRequested = output<void>();

  // ─── Current User ───────────────────────────────────────────────
  // Read the logged-in user from AuthService's signal.
  // This updates automatically when user data changes.
  currentUser = this.authService.currentUser;

  /** First two initials of the user's name, e.g. "Arjun Sharma" → "AS" */
  userInitials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    return name.split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('');
  });

  // ─── Navigation Items ───────────────────────────────────────────
  /** All sidebar navigation links */
  readonly navItems: NavItem[] = [
    { path: '/dashboard',       label: 'Dashboard',           icon: '📊' },
    { path: '/transactions',    label: 'Transactions',        icon: '💳' },
    { path: '/income-expenses', label: 'Income & Expenses',   icon: '💰' },
    { path: '/investments',     label: 'Investment Portfolio',icon: '📈' },
    { path: '/analytics',       label: 'Analytics',           icon: '📉' },
    { path: '/profile',         label: 'Profile',             icon: '👤' },
    { path: '/settings',        label: 'Settings',            icon: '⚙️' },
  ];

  // ─── Methods ────────────────────────────────────────────────────

  /** Emits close event (parent will slide sidebar out) */
  close(): void {
    this.closeRequested.emit();
  }

  /** Close sidebar after clicking a nav link on mobile */
  onNavClick(): void {
    this.closeRequested.emit();
  }

  /** Log out the current user and redirect to login */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

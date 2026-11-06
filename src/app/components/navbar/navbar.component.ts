/**
 * navbar.component.ts — Top Navigation Bar
 *
 * The navbar sits at the TOP of every protected page.
 * It shows:
 *   - Hamburger button (mobile) → emits event to open/close sidebar
 *   - Current page title (auto-detected from the URL)
 *   - Theme toggle button (🌙 / ☀️)
 *   - Notification bell 🔔
 *   - User avatar with dropdown menu (Profile + Logout)
 *
 * PAGE TITLE:
 * We watch the Router for URL changes using `toSignal`.
 * Whenever the URL changes (e.g. from /dashboard to /transactions),
 * the page title automatically updates — no manual code needed!
 *
 * OUTPUT:
 * - (sidebarToggled) → emits void when hamburger ☰ is clicked
 *   LayoutComponent listens and toggles the sidebar open/close.
 */

import {
  Component, inject, signal, computed, output,
  HostListener, ElementRef
} from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal }    from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

import { AuthService }  from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  // ─── Inject Services ────────────────────────────────────────────
  private authService  = inject(AuthService);
  private themeService = inject(ThemeService);
  private router       = inject(Router);
  private elementRef   = inject(ElementRef);

  // ─── Output: notify parent (LayoutComponent) to toggle sidebar ──
  sidebarToggled = output<void>();

  // ─── Current User ───────────────────────────────────────────────
  currentUser = this.authService.currentUser;

  /** User's initials for the avatar circle, e.g. "Arjun Sharma" → "AS" */
  userInitials = computed(() => {
    const name = this.currentUser()?.fullName ?? 'U';
    return name.split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('');
  });

  // ─── Theme ──────────────────────────────────────────────────────
  isDarkMode  = this.themeService.isDarkMode;
  themeIcon   = this.themeService.themeIcon;
  themeLabel  = this.themeService.themeLabel;

  // ─── Page Title (auto-detects from URL) ─────────────────────────
  /**
   * We convert router NavigationEnd events to a signal using toSignal().
   * Every time the user navigates to a new page, this signal updates,
   * which triggers the computed pageTitle to recalculate.
   */
  private routeUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Maps URL paths to human-readable page titles */
  private readonly pageTitleMap: Record<string, { title: string; icon: string }> = {
    'dashboard':       { title: 'Dashboard',            icon: '📊' },
    'transactions':    { title: 'Transactions',          icon: '💳' },
    'income-expenses': { title: 'Income & Expenses',     icon: '💰' },
    'investments':     { title: 'Investment Portfolio',  icon: '📈' },
    'analytics':       { title: 'Analytics',             icon: '📉' },
    'profile':         { title: 'Profile',               icon: '👤' },
    'settings':        { title: 'Settings',              icon: '⚙️' },
  };

  /** Automatically derives the page title from the current URL */
  pageInfo = computed(() => {
    const url   = this.routeUrl() ?? '';
    // Extract the first path segment: '/dashboard' → 'dashboard'
    const segment = url.replace(/^\//, '').split('/')[0].split('?')[0];
    return this.pageTitleMap[segment] ?? { title: 'FinVault', icon: '💎' };
  });

  // ─── Profile Dropdown ───────────────────────────────────────────
  showProfileMenu = signal(false);

  toggleProfileMenu(): void {
    this.showProfileMenu.update(v => !v);
  }

  /**
   * Close the profile dropdown when user clicks ANYWHERE outside the navbar.
   * @HostListener listens to click events on the whole document.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // If the click happened OUTSIDE this component, close the dropdown
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
  }

  // ─── Methods ────────────────────────────────────────────────────

  /** Tell the layout to toggle the sidebar */
  onToggleSidebar(): void {
    this.sidebarToggled.emit();
  }

  /** Toggle between dark and light theme */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /** Log out and go to login page */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

/**
 * layout.component.ts — App Shell / Layout Wrapper
 *
 * This is the MASTER CONTAINER for all protected pages.
 * It is the parent that holds:
 *   - The Sidebar (left navigation panel)
 *   - The Navbar (top bar)
 *   - The <router-outlet> (where Dashboard, Transactions, etc. render)
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────
 * When you visit /#/dashboard, Angular loads:
 *   1. LayoutComponent (the shell)       → renders sidebar + navbar
 *   2. DashboardComponent (the content)  → renders inside <router-outlet>
 *
 * This means we write the sidebar and navbar ONCE here, and every
 * protected page automatically gets them — no copy-pasting!
 *
 * MOBILE SIDEBAR:
 * On small screens, the sidebar is hidden by default.
 * When the user clicks the hamburger (☰) in the navbar, `sidebarOpen`
 * flips to true → sidebar slides in. Click the overlay to close it.
 */

import { Component, signal } from '@angular/core';
import { RouterOutlet }      from '@angular/router';
import { SidebarComponent }  from '../sidebar/sidebar.component';
import { NavbarComponent }   from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  // ─── Sidebar open/close state (for mobile) ───────────────────────
  // On desktop, the sidebar is always visible (CSS handles this).
  // On mobile, we toggle this signal to slide the sidebar in/out.
  sidebarOpen = signal(false);

  /** Called by NavbarComponent when hamburger ☰ is clicked */
  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  /** Called when user clicks the dark overlay behind the mobile sidebar */
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}

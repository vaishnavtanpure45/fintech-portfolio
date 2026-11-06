/**
 * login.component.ts — Login Page
 *
 * This component handles user authentication.
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────
 * 1. User fills in email + password
 * 2. We validate the form (all fields filled? email format correct?)
 * 3. We call authService.login()
 * 4. AuthService checks credentials against JSON Server
 * 5. If correct → redirect to /dashboard
 * 6. If wrong   → show error message on screen
 *
 * REACTIVE FORMS:
 * We use Angular's ReactiveFormsModule for form handling.
 * This gives us powerful validation and control over form state.
 */

import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  // ─── Inject Services ────────────────────────────────────────────────
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  // ─── Signals (reactive state) ────────────────────────────────────────
  isLoading    = signal(false);   // true while waiting for API response
  errorMessage = signal('');      // shown in red if login fails
  showPassword = signal(false);   // toggles password input visibility

  // ─── Reactive Form ───────────────────────────────────────────────────
  loginForm: FormGroup;

  constructor() {
    // If user is already logged in, skip the login page → go to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    // Create the login form with two fields and their validation rules
    this.loginForm = this.fb.group({
      email: [
        '',  // initial value (empty)
        [Validators.required, Validators.email]  // must be filled + valid email format
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(6)]  // must be filled + at least 6 chars
      ]
    });
  }

  // ─── Shortcut Getters ────────────────────────────────────────────────
  // These make it easier to access form controls in the HTML template.
  // Instead of writing loginForm.get('email') every time, we just write emailCtrl
  get emailCtrl()    { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  // ─── Toggle Password Visibility ─────────────────────────────────────
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // ─── Fill Demo Credentials ───────────────────────────────────────────
  /**
   * When user clicks "Use Demo Account", we pre-fill the form
   * with working credentials from db.json. Great for demos!
   */
  fillDemo(): void {
    this.loginForm.patchValue({
      email: 'arjun@finvault.com',
      password: 'Demo@1234'
    });
    this.errorMessage.set('');
  }

  // ─── Form Submit ─────────────────────────────────────────────────────
  /**
   * onSubmit() — Called when user clicks "Sign In"
   *
   * Step 1: If form has errors → highlight them and stop
   * Step 2: Show loading spinner
   * Step 3: Call authService.login()
   * Step 4: On success → go to /dashboard
   * Step 5: On error  → show the error message
   */
  onSubmit(): void {
    // If form is invalid, mark all fields as "touched" so errors show
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        // ✅ Login successful → navigate to dashboard
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        // ❌ Login failed → show the error message
        this.isLoading.set(false);
        this.errorMessage.set(err.message);
      }
    });
  }
}

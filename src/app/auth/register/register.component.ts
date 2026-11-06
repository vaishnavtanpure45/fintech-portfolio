/**
 * register.component.ts — Registration Page
 *
 * This component handles new user account creation.
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────
 * 1. User fills in Full Name, Email, Password, Confirm Password
 * 2. We validate the form:
 *    - All fields required
 *    - Valid email format
 *    - Password at least 8 characters
 *    - Confirm password must MATCH the password exactly
 * 3. We call authService.createUser() → POST to JSON Server
 * 4. JSON Server saves the user and returns them with a unique ID
 * 5. AuthService auto-logs them in and saves to localStorage
 * 6. We redirect to /dashboard
 *
 * CUSTOM VALIDATOR:
 * Angular has built-in validators (required, email, minLength) but
 * it doesn't have one for "password matching". So we write our own!
 * See the passwordMatchValidator function below.
 */

import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// ─── Custom Validator: Password Match ─────────────────────────────────
/**
 * passwordMatchValidator — checks that password === confirmPassword
 *
 * This is a "group-level" validator — it checks TWO fields at once.
 * We attach it to the FormGroup, not to individual controls.
 *
 * Returns:
 *   null           → passwords match (no error)
 *   { mismatch: true } → passwords do NOT match (error!)
 */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password        = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  // Only check if both fields have values
  if (password && confirmPassword && password !== confirmPassword) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  // ─── Inject Services ────────────────────────────────────────────────
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  // ─── Signals ────────────────────────────────────────────────────────
  isLoading      = signal(false);
  errorMessage   = signal('');
  successMessage = signal('');
  showPassword   = signal(false);
  showConfirm    = signal(false);

  // ─── Reactive Form ───────────────────────────────────────────────────
  registerForm: FormGroup;

  constructor() {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.fb.group(
      {
        fullName: [
          '',
          [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
        ],
        email: [
          '',
          [Validators.required, Validators.email]
        ],
        password: [
          '',
          [Validators.required, Validators.minLength(8)]
        ],
        confirmPassword: [
          '',
          [Validators.required]
        ]
      },
      {
        // Attach the custom validator to the entire group
        validators: passwordMatchValidator
      }
    );
  }

  // ─── Shortcut Getters ────────────────────────────────────────────────
  get fullNameCtrl()       { return this.registerForm.get('fullName')!; }
  get emailCtrl()          { return this.registerForm.get('email')!; }
  get passwordCtrl()       { return this.registerForm.get('password')!; }
  get confirmPasswordCtrl(){ return this.registerForm.get('confirmPassword')!; }

  // ─── Password Strength ───────────────────────────────────────────────
  /**
   * getPasswordStrength() — Rates the password from 0 to 4
   *
   * Returns:
   *   0 = very weak (less than 4 chars)
   *   1 = weak      (8+ chars)
   *   2 = fair      (8+ chars + numbers)
   *   3 = good      (8+ chars + numbers + uppercase)
   *   4 = strong    (8+ chars + numbers + uppercase + special char)
   *
   * Used to show the password strength bar in the template.
   */
  getPasswordStrength(): number {
    const pwd = this.passwordCtrl.value ?? '';
    if (pwd.length < 4)  return 0;

    let strength = 0;
    if (pwd.length >= 8)                   strength++;  // length OK
    if (/[0-9]/.test(pwd))                 strength++;  // has number
    if (/[A-Z]/.test(pwd))                 strength++;  // has uppercase
    if (/[^A-Za-z0-9]/.test(pwd))          strength++;  // has special char

    return strength;
  }

  getStrengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.getPasswordStrength()] ?? '';
  }

  getStrengthColor(): string {
    const colors = ['', '#ef4444', '#f59e0b', '#0ea5e9', '#10b981'];
    return colors[this.getPasswordStrength()] ?? '';
  }

  // ─── Password visibility toggles ────────────────────────────────────
  togglePassword(): void        { this.showPassword.update(v => !v); }
  toggleConfirmPassword(): void { this.showConfirm.update(v => !v); }

  // ─── Form Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { fullName, email, password } = this.registerForm.value;

    // Step 1: Check if email is already taken
    this.authService.register({ fullName, email, password, confirmPassword: '' }).subscribe({
      next: () => {
        // Step 2: Create the user via POST
        this.authService.createUser({
          fullName,
          email,
          password,
          phone: '',
          occupation: '',
          currency: 'INR',
          avatar: '',
          createdAt: new Date().toISOString()
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.successMessage.set('Account created successfully! Redirecting...');
            // Short delay so user sees the success message
            setTimeout(() => this.router.navigate(['/dashboard']), 1200);
          },
          error: (err: Error) => {
            this.isLoading.set(false);
            this.errorMessage.set(err.message);
          }
        });
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message);
      }
    });
  }
}

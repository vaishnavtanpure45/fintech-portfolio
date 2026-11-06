/**
 * auth.service.ts — Authentication Service
 *
 * This service handles everything related to user identity:
 *   - Logging in
 *   - Registering a new account
 *   - Logging out
 *   - Remembering who is logged in (using localStorage + Angular Signal)
 *
 * SIMPLE EXPLANATION OF HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────
 * 1. User types email + password → we call login()
 * 2. login() asks JSON Server: "GET /users" → gets all users
 * 3. We find the user whose email AND password match
 * 4. If found  → save user to localStorage → update currentUser signal
 * 5. If not found → throw an error → login form shows the error message
 *
 * WHY localStorage?
 * localStorage is like a small notebook in the browser.
 * It keeps data even after you close and reopen the tab.
 * So the user stays "logged in" across page refreshes.
 *
 * IMPORTANT SECURITY NOTE (for your project report):
 * We store plain-text passwords in db.json because this is a demo/academic
 * project using JSON Server. In a real production app, passwords must be
 * hashed (using bcrypt) and stored securely on a proper backend server.
 * JSON Server is ONLY suitable for learning and demos.
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, LoginCredentials, RegisterData } from '../models/user';

@Injectable({
  // providedIn: 'root' means Angular creates ONE shared instance of this
  // service for the whole app. Every component that needs AuthService
  // gets the SAME instance (not a new copy each time).
  providedIn: 'root'
})
export class AuthService {

  // ─── Private constants ───────────────────────────────────────────────
  private readonly API_URL = 'http://localhost:3000';
  private readonly STORAGE_KEY = 'finvault-user'; // Key used in localStorage

  // ─── Inject HttpClient ────────────────────────────────────────────────
  // HttpClient is Angular's tool for making HTTP requests (GET, POST, etc.)
  private http = inject(HttpClient);

  // ─── currentUser Signal ───────────────────────────────────────────────
  // A "signal" is Angular's modern way to store reactive state.
  // When currentUser changes, any component reading it auto-updates.
  //
  // We initialize it by reading localStorage — so if the user refreshes
  // the page, they stay logged in (we remember them from last session).
  private _currentUser = signal<User | null>(this.loadUserFromStorage());

  // Public read-only view of the current user (components can READ but not WRITE)
  currentUser = this._currentUser.asReadonly();

  // ─── isLoggedIn Signal ────────────────────────────────────────────────
  // "computed" automatically recalculates when currentUser changes.
  // isLoggedIn is true when there IS a logged-in user, false when there isn't.
  isLoggedIn = computed(() => this._currentUser() !== null);

  // ─── LOGIN ────────────────────────────────────────────────────────────
  /**
   * login(credentials) — Authenticates the user
   *
   * Flow:
   *   1. GET all users from JSON Server
   *   2. Find user with matching email (case-insensitive)
   *   3. Check password matches
   *   4. Save user to localStorage + update signal
   *   5. Return the user object (or throw error if invalid)
   *
   * Usage in component:
   *   this.authService.login({ email, password }).subscribe({
   *     next: (user) => router.navigate(['/dashboard']),
   *     error: (err) => this.errorMsg = err.message
   *   });
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      map(users => {
        // Find user with matching email (toLowerCase for case-insensitive match)
        const user = users.find(
          u => u.email.toLowerCase() === credentials.email.toLowerCase()
        );

        // Email not found
        if (!user) {
          throw new Error('No account found with this email address.');
        }

        // Password doesn't match
        if (user.password !== credentials.password) {
          throw new Error('Incorrect password. Please try again.');
        }

        // ✅ Success — save user to localStorage and update the signal
        this.saveUserToStorage(user);
        this._currentUser.set(user);
        return user;
      }),
      catchError(err => {
        // If it's already a thrown Error from above, re-throw it
        if (err instanceof Error) return throwError(() => err);
        // Otherwise it's an HTTP error (network down, server not running, etc.)
        return throwError(() => new Error(
          'Cannot connect to server. Make sure JSON Server is running on port 3000.'
        ));
      })
    );
  }

  // ─── REGISTER ─────────────────────────────────────────────────────────
  /**
   * register(data) — Creates a new user account
   *
   * Flow:
   *   1. GET all users to check if email is already taken
   *   2. If email already exists → throw error
   *   3. If email is new → POST new user to JSON Server
   *   4. Auto-login the new user
   */
  register(data: RegisterData): Observable<User> {
    return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      map(users => {
        // Check if email is already registered
        const exists = users.find(
          u => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (exists) {
          throw new Error('An account with this email already exists. Please login instead.');
        }
        return users;
      }),
      // After the check passes, POST the new user
      // We use a different approach: return an observable chain
      catchError(err => {
        if (err instanceof Error) return throwError(() => err);
        return throwError(() => new Error('Cannot connect to server.'));
      }),
      // switchMap would go here but to keep it simple we do it in two steps
      // The component calls this, sees success, then immediately logs in
      map(() => {
        // Build the new user object (without confirmPassword — that's only for the form)
        const newUser: Omit<User, 'id'> = {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          phone: '',
          occupation: '',
          currency: 'INR',
          avatar: '',
          createdAt: new Date().toISOString()
        };
        return newUser as User; // We'll get the real id from the POST response
      })
    );
  }

  /**
   * createUser(userData) — Actually POSTs the new user to JSON Server
   * Called by the register component after validation passes.
   */
  createUser(userData: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users`, userData).pipe(
      tap(newUser => {
        // Auto-login the newly registered user
        this.saveUserToStorage(newUser);
        this._currentUser.set(newUser);
      }),
      catchError(() => throwError(() => new Error(
        'Registration failed. Cannot connect to server. Make sure JSON Server is running.'
      )))
    );
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────
  /**
   * logout() — Clears the user session
   *
   * Removes user from localStorage and resets the signal to null.
   * The AuthGuard will then redirect to /login on next protected page visit.
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentUser.set(null);
  }

  // ─── GET CURRENT USER ID ──────────────────────────────────────────────
  /**
   * getCurrentUserId() — Returns the logged-in user's ID
   * Used by TransactionService and InvestmentService to filter records.
   */
  getCurrentUserId(): string {
    return this._currentUser()?.id ?? '';
  }

  // ─── UPDATE PROFILE ───────────────────────────────────────────────────
  /**
   * updateProfile(id, updatedData) — Updates user info in JSON Server
   * Called from the Profile page when user saves changes.
   */
  updateProfile(id: string, updatedData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${id}`, updatedData).pipe(
      tap(updatedUser => {
        // Update localStorage and the signal so the UI reflects changes instantly
        this.saveUserToStorage(updatedUser);
        this._currentUser.set(updatedUser);
      }),
      catchError(() => throwError(() => new Error('Failed to update profile. Please try again.')))
    );
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────

  /** Saves user to localStorage as a JSON string */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /** Reads user from localStorage — returns User object or null */
  private loadUserFromStorage(): User | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      // If localStorage has corrupted data, clear it and return null
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
}

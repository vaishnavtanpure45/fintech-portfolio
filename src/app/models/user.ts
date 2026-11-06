/**
 * user.ts — User Model
 *
 * This interface describes the shape of a "User" object in our app.
 * Every user stored in db.json must follow this exact structure.
 *
 * SIMPLE EXPLANATION:
 * An "interface" in TypeScript is like a contract or a blueprint.
 * It says: "Any object that calls itself a User MUST have these fields."
 * If you forget a field or misspell it, TypeScript will show a red error
 * immediately — before you even run the app!
 */

export interface User {
  id: string;           // Unique identifier (e.g. "1", "2", "3")
  fullName: string;     // User's full name (e.g. "Arjun Sharma")
  email: string;        // Email used to log in (e.g. "arjun@finvault.com")
  password: string;     // Password (plain text for demo — NOT for production)
  phone: string;        // Phone number (e.g. "+91 98765 43210")
  occupation: string;   // Job title (e.g. "Software Engineer")
  currency: string;     // Preferred currency (e.g. "INR")
  avatar: string;       // Profile picture URL (empty string if not set)
  createdAt: string;    // ISO date string when account was created
}

/**
 * LoginCredentials — used for the Login form
 *
 * When a user types their email and password to log in,
 * we represent that data using this simpler interface.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * RegisterData — used for the Registration form
 *
 * When a new user fills out the registration form,
 * we represent that data using this interface.
 * Note: confirmPassword is only used for form validation — it's NOT saved to db.json
 */
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

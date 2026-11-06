/**
 * transaction.service.ts — Transaction Service
 *
 * This service handles ALL operations related to financial transactions:
 *   - Fetching transactions from JSON Server
 *   - Adding a new transaction
 *   - Editing an existing transaction
 *   - Deleting a transaction
 *   - Calculating totals (income, expenses, net balance)
 *
 * SIMPLE EXPLANATION OF REACTIVE DATA FLOW:
 * ─────────────────────────────────────────────────────────────────────
 * We use a "BehaviorSubject" called refreshTrigger$ as a signal gun.
 * Every time you add, edit, or delete a transaction, we "fire" this gun.
 * Any component watching the transactions list will automatically
 * re-fetch and re-display the updated data.
 *
 * Think of it like pressing F5 on a webpage — but automatically,
 * only when something actually changes.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import {
  Transaction,
  TransactionSummary,
  MonthlyData,
  CategoryData
} from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  // ─── Constants ──────────────────────────────────────────────────────
  private readonly API_URL = 'http://localhost:3000/transactions';

  // ─── HttpClient ─────────────────────────────────────────────────────
  private http = inject(HttpClient);

  // ─── Refresh Trigger ────────────────────────────────────────────────
  // This BehaviorSubject acts as a "reload" button.
  // We call refreshTrigger$.next() after any add/edit/delete.
  // Components can use this to know when to re-fetch data.
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // ─── GET ALL TRANSACTIONS FOR A USER ────────────────────────────────
  /**
   * getTransactions(userId) — Returns all transactions belonging to a user
   *
   * We filter by userId so each user only sees THEIR OWN transactions.
   * JSON Server supports filtering via query params: /transactions?userId=1
   *
   * Usage in component:
   *   this.transactionService.getTransactions('1').subscribe(transactions => {
   *     this.myTransactions = transactions;
   *   });
   */
  getTransactions(userId: string): Observable<Transaction[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Transaction[]>(this.API_URL, { params }).pipe(
      // Sort by date descending (newest transaction first)
      map(transactions =>
        transactions.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      ),
      catchError(() => throwError(() => new Error(
        'Failed to load transactions. Make sure JSON Server is running on port 3000.'
      )))
    );
  }

  /**
   * getTransactions$(userId) — Reactive version that auto-refreshes
   *
   * This observable re-fetches data AUTOMATICALLY whenever refreshTrigger$
   * fires (i.e. after every add, edit, or delete operation).
   *
   * Usage in component (best practice):
   *   this.transactions$ = this.transactionService.getTransactions$('1');
   *   // Then in HTML: *ngFor="let t of transactions$ | async"
   */
  getTransactions$(userId: string): Observable<Transaction[]> {
    return this.refreshTrigger$.pipe(
      // switchMap: whenever the trigger fires, switch to a fresh HTTP call
      switchMap(() => this.getTransactions(userId))
    );
  }

  // ─── GET SINGLE TRANSACTION ─────────────────────────────────────────
  /**
   * getTransactionById(id) — Fetches one specific transaction
   * Used when editing a transaction to pre-fill the form.
   */
  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.API_URL}/${id}`).pipe(
      catchError(() => throwError(() => new Error('Transaction not found.')))
    );
  }

  // ─── ADD TRANSACTION ────────────────────────────────────────────────
  /**
   * addTransaction(transaction) — Creates a new transaction in JSON Server
   *
   * Flow:
   *   1. POST the new transaction object to /transactions
   *   2. JSON Server auto-assigns a unique ID
   *   3. We fire the refresh trigger so lists auto-update
   */
  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http.post<Transaction>(this.API_URL, transaction).pipe(
      tap(() => this.refresh()), // Fire refresh trigger after success
      catchError(() => throwError(() => new Error('Failed to add transaction. Please try again.')))
    );
  }

  // ─── UPDATE TRANSACTION ─────────────────────────────────────────────
  /**
   * updateTransaction(id, transaction) — Edits an existing transaction
   *
   * We use PUT which replaces the entire object.
   * (PATCH would only update specific fields — both work with JSON Server)
   */
  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.API_URL}/${id}`, transaction).pipe(
      tap(() => this.refresh()),
      catchError(() => throwError(() => new Error('Failed to update transaction. Please try again.')))
    );
  }

  // ─── DELETE TRANSACTION ─────────────────────────────────────────────
  /**
   * deleteTransaction(id) — Removes a transaction permanently
   */
  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.refresh()),
      catchError(() => throwError(() => new Error('Failed to delete transaction. Please try again.')))
    );
  }

  // ─── CALCULATIONS ───────────────────────────────────────────────────

  /**
   * getSummary(transactions) — Computes income, expenses, net balance
   *
   * Formula:
   *   Total Income   = sum of all transactions where type === 'income'
   *   Total Expenses = sum of all transactions where type === 'expense'
   *   Net Balance    = Total Income - Total Expenses
   *
   * This is a PURE function — no HTTP calls, just math on the array.
   */
  getSummary(transactions: Transaction[]): TransactionSummary {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses
    };
  }

  /**
   * getMonthlyData(transactions) — Groups transactions by month for charts
   *
   * Returns an array like:
   * [
   *   { month: 'Sep 2026', income: 100000, expense: 30000 },
   *   { month: 'Oct 2026', income: 110000, expense: 35000 },
   *   { month: 'Nov 2026', income: 115500, expense: 27198 },
   * ]
   *
   * The Analytics and Income/Expenses pages use this for bar charts.
   */
  getMonthlyData(transactions: Transaction[]): MonthlyData[] {
    // Build a map: "Nov 2026" → { income: X, expense: Y }
    const monthMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      // Format: "Nov 2026"
      const monthKey = date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expense: 0 });
      }

      const entry = monthMap.get(monthKey)!;
      if (t.type === 'income') {
        entry.income += t.amount;
      } else {
        entry.expense += t.amount;
      }
    });

    // Convert map to sorted array (oldest month first)
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }

  /**
   * getCategoryData(transactions) — Groups EXPENSES by category for pie chart
   *
   * Returns an array like:
   * [
   *   { category: 'Rent',      amount: 18000 },
   *   { category: 'Food',      amount: 7000  },
   *   { category: 'Transport', amount: 4000  },
   * ]
   *
   * Only includes expense transactions (not income).
   */
  getCategoryData(transactions: Transaction[]): CategoryData[] {
    const categoryMap = new Map<string, number>();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryMap.get(t.category) ?? 0;
        categoryMap.set(t.category, current + t.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount); // Sort by highest spending first
  }

  /**
   * getRecentTransactions(transactions, count) — Returns the N most recent
   * Used by the Dashboard to show the last 5 transactions.
   */
  getRecentTransactions(transactions: Transaction[], count: number = 5): Transaction[] {
    return transactions.slice(0, count); // Already sorted by date desc in getTransactions()
  }

  // ─── REFRESH TRIGGER ────────────────────────────────────────────────
  /**
   * refresh() — Fires the refresh trigger
   * Called internally after every add/edit/delete.
   * Can also be called manually if needed.
   */
  refresh(): void {
    this.refreshTrigger$.next();
  }
}

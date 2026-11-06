/**
 * investment.service.ts — Investment Service
 *
 * This service handles ALL operations related to investments:
 *   - Fetching investments from JSON Server
 *   - Adding a new investment
 *   - Editing an existing investment
 *   - Deleting an investment
 *   - Calculating profit/loss, return percentage, portfolio distribution
 *
 * KEY FORMULAS USED IN THIS SERVICE:
 * ─────────────────────────────────────────────────────────────────────
 *   Profit/Loss      = currentValue - investedAmount
 *   Return %         = (Profit/Loss / investedAmount) × 100
 *
 *   Portfolio Total  = sum of all currentValue fields
 *   Distribution %   = (type's currentValue / Portfolio Total) × 100
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import {
  Investment,
  InvestmentSummary,
  PortfolioDistribution
} from '../models/investment';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  // ─── Constants ──────────────────────────────────────────────────────
  private readonly API_URL = 'http://localhost:3000/investments';

  // ─── HttpClient ─────────────────────────────────────────────────────
  private http = inject(HttpClient);

  // ─── Refresh Trigger ────────────────────────────────────────────────
  // Same pattern as TransactionService — fires after any CUD operation
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // ─── GET ALL INVESTMENTS FOR A USER ─────────────────────────────────
  /**
   * getInvestments(userId) — Fetches all investments for a specific user
   * Filters by userId so users only see their own portfolio.
   */
  getInvestments(userId: string): Observable<Investment[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Investment[]>(this.API_URL, { params }).pipe(
      // Sort by purchase date descending (most recent investment first)
      map(investments =>
        investments.sort((a, b) =>
          new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        )
      ),
      catchError(() => throwError(() => new Error(
        'Failed to load investments. Make sure JSON Server is running on port 3000.'
      )))
    );
  }

  /**
   * getInvestments$(userId) — Reactive version that auto-refreshes
   * Any component using this observable will update when data changes.
   */
  getInvestments$(userId: string): Observable<Investment[]> {
    return this.refreshTrigger$.pipe(
      switchMap(() => this.getInvestments(userId))
    );
  }

  // ─── GET SINGLE INVESTMENT ──────────────────────────────────────────
  /**
   * getInvestmentById(id) — Fetches one specific investment
   * Used when editing an investment to pre-fill the form.
   */
  getInvestmentById(id: string): Observable<Investment> {
    return this.http.get<Investment>(`${this.API_URL}/${id}`).pipe(
      catchError(() => throwError(() => new Error('Investment not found.')))
    );
  }

  // ─── ADD INVESTMENT ─────────────────────────────────────────────────
  /**
   * addInvestment(investment) — Creates a new investment in JSON Server
   */
  addInvestment(investment: Omit<Investment, 'id'>): Observable<Investment> {
    return this.http.post<Investment>(this.API_URL, investment).pipe(
      tap(() => this.refresh()),
      catchError(() => throwError(() => new Error('Failed to add investment. Please try again.')))
    );
  }

  // ─── UPDATE INVESTMENT ──────────────────────────────────────────────
  /**
   * updateInvestment(id, investment) — Edits an existing investment
   */
  updateInvestment(id: string, investment: Partial<Investment>): Observable<Investment> {
    return this.http.put<Investment>(`${this.API_URL}/${id}`, investment).pipe(
      tap(() => this.refresh()),
      catchError(() => throwError(() => new Error('Failed to update investment. Please try again.')))
    );
  }

  // ─── DELETE INVESTMENT ──────────────────────────────────────────────
  /**
   * deleteInvestment(id) — Removes an investment permanently
   */
  deleteInvestment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.refresh()),
      catchError(() => throwError(() => new Error('Failed to delete investment. Please try again.')))
    );
  }

  // ─── CALCULATIONS ───────────────────────────────────────────────────

  /**
   * getProfitLoss(investment) — Calculates profit or loss for ONE investment
   *
   * Formula: currentValue - investedAmount
   * Positive result = Profit (shown in green)
   * Negative result = Loss   (shown in red)
   *
   * Example:
   *   investedAmount = 50,000  currentValue = 67,500
   *   Profit = 67,500 - 50,000 = +17,500 ✅
   */
  getProfitLoss(investment: Investment): number {
    return investment.currentValue - investment.investedAmount;
  }

  /**
   * getReturnPercentage(investment) — Calculates % return for ONE investment
   *
   * Formula: (Profit/Loss / investedAmount) × 100
   * Rounded to 2 decimal places.
   *
   * Example:
   *   Profit = 17,500   investedAmount = 50,000
   *   Return % = (17,500 / 50,000) × 100 = 35.00%
   */
  getReturnPercentage(investment: Investment): number {
    if (investment.investedAmount === 0) return 0;
    const profitLoss = this.getProfitLoss(investment);
    return Math.round((profitLoss / investment.investedAmount) * 10000) / 100;
  }

  /**
   * getSummary(investments) — Computes TOTAL portfolio summary
   *
   * Returns:
   * {
   *   totalInvested:    6,21,000   (sum of all investedAmount)
   *   totalCurrentValue: 6,90,350  (sum of all currentValue)
   *   totalProfitLoss:    69,350   (totalCurrentValue - totalInvested)
   *   returnPercentage:   11.17%   (overall return %)
   * }
   */
  getSummary(investments: Investment[]): InvestmentSummary {
    const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0
      ? Math.round((totalProfitLoss / totalInvested) * 10000) / 100
      : 0;

    return { totalInvested, totalCurrentValue, totalProfitLoss, returnPercentage };
  }

  /**
   * getPortfolioDistribution(investments) — Breakdown by investment type
   *
   * Used by the Portfolio Pie Chart.
   * Returns how much of your portfolio (by current value) is in each type.
   *
   * Example output:
   * [
   *   { type: 'Stock',          value: 240000, percentage: 34.76 },
   *   { type: 'Fixed Deposit',  value: 216800, percentage: 31.40 },
   *   { type: 'Mutual Fund',    value: 104000, percentage: 15.07 },
   *   { type: 'ETF',            value: 83600,  percentage: 12.11 },
   *   { type: 'Gold',           value: 45950,  percentage: 6.66  },
   * ]
   */
  getPortfolioDistribution(investments: Investment[]): PortfolioDistribution[] {
    const totalValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    if (totalValue === 0) return [];

    // Group by type
    const typeMap = new Map<string, number>();
    investments.forEach(i => {
      const current = typeMap.get(i.type) ?? 0;
      typeMap.set(i.type, current + i.currentValue);
    });

    // Convert to array with percentages
    return Array.from(typeMap.entries())
      .map(([type, value]) => ({
        type,
        value,
        percentage: Math.round((value / totalValue) * 10000) / 100
      }))
      .sort((a, b) => b.value - a.value); // Sort by highest value first
  }

  // ─── REFRESH TRIGGER ────────────────────────────────────────────────
  refresh(): void {
    this.refreshTrigger$.next();
  }
}

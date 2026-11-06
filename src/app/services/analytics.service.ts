/**
 * analytics.service.ts — Analytics Service
 *
 * This service prepares ALL the data needed for Chart.js charts.
 * It transforms raw transactions and investments into the exact format
 * Chart.js needs to draw beautiful bar, doughnut, and line charts.
 *
 * WHAT THIS SERVICE DOES:
 * ─────────────────────────────────────────────────────────────────────
 * Chart.js needs data in this format:
 *   {
 *     labels: ['Sep 2026', 'Oct 2026', 'Nov 2026'],
 *     datasets: [
 *       { label: 'Income',   data: [100000, 110000, 115500], backgroundColor: 'green' },
 *       { label: 'Expenses', data: [30000,  35000,  27198],  backgroundColor: 'red'  }
 *     ]
 *   }
 *
 * This service takes your raw transactions/investments and formats them
 * into exactly this structure so Chart.js can draw the charts.
 *
 * CHARTS WE SUPPORT:
 *   1. Income vs Expenses Bar Chart (monthly)
 *   2. Category-wise Expense Doughnut Chart
 *   3. Investment Portfolio Doughnut Chart
 *   4. Net Balance Line Chart (monthly trend)
 *   5. Profit/Loss Bar Chart (per investment)
 */

import { Injectable, inject } from '@angular/core';
import { TransactionService } from './transaction.service';
import { InvestmentService } from './investment.service';
import { Transaction } from '../models/transaction';
import { Investment } from '../models/investment';

// Chart.js data format interfaces
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  // We inject the other services to reuse their calculation methods
  private transactionService = inject(TransactionService);
  private investmentService = inject(InvestmentService);

  // ─── BRAND COLORS ────────────────────────────────────────────────────
  // Consistent colors used across all charts (matches our CSS design system)
  readonly COLORS = {
    income:  '#10b981',   // Emerald green
    expense: '#ef4444',   // Red
    profit:  '#10b981',   // Green
    loss:    '#ef4444',   // Red
    balance: '#6366f1',   // Indigo (brand color)

    // Portfolio type colors
    stock:   '#6366f1',   // Indigo
    mf:      '#0ea5e9',   // Sky blue
    etf:     '#f59e0b',   // Amber
    fd:      '#10b981',   // Green
    gold:    '#f97316',   // Orange

    // Category colors (for expense breakdown)
    categoryPalette: [
      '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#f97316', '#06b6d4',
      '#84cc16', '#ec4899', '#14b8a6', '#a855f7'
    ]
  };

  // ─── 1. INCOME vs EXPENSES BAR CHART ─────────────────────────────────
  /**
   * getIncomeExpenseChartData(transactions)
   *
   * Creates data for a grouped bar chart showing:
   *   - Green bars: monthly income
   *   - Red bars:   monthly expenses
   *
   * Used on: Dashboard, Analytics page, Income & Expenses page
   */
  getIncomeExpenseChartData(transactions: Transaction[]): ChartConfig {
    const monthlyData = this.transactionService.getMonthlyData(transactions);

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: this.hexToRgba(this.COLORS.income, 0.85),
          borderColor: this.COLORS.income,
          borderWidth: 2
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expense),
          backgroundColor: this.hexToRgba(this.COLORS.expense, 0.85),
          borderColor: this.COLORS.expense,
          borderWidth: 2
        }
      ]
    };
  }

  // ─── 2. NET BALANCE LINE CHART ────────────────────────────────────────
  /**
   * getNetBalanceChartData(transactions)
   *
   * Creates data for a line chart showing monthly net balance trend.
   * Net Balance = Income - Expenses for each month.
   * Positive = good (above zero), Negative = overspending (below zero).
   *
   * Used on: Analytics page
   */
  getNetBalanceChartData(transactions: Transaction[]): ChartConfig {
    const monthlyData = this.transactionService.getMonthlyData(transactions);

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Net Balance',
          data: monthlyData.map(d => d.income - d.expense),
          backgroundColor: this.hexToRgba(this.COLORS.balance, 0.15),
          borderColor: this.COLORS.balance,
          borderWidth: 2,
          fill: true,
          tension: 0.4  // Makes the line curve smoothly instead of sharp angles
        }
      ]
    };
  }

  // ─── 3. CATEGORY EXPENSE DOUGHNUT CHART ──────────────────────────────
  /**
   * getCategoryChartData(transactions)
   *
   * Creates data for a doughnut chart showing expense breakdown by category.
   * Example: 35% Rent, 20% Food, 15% Transport, etc.
   *
   * Used on: Analytics page, Income & Expenses page, Dashboard
   */
  getCategoryChartData(transactions: Transaction[]): ChartConfig {
    const categoryData = this.transactionService.getCategoryData(transactions);

    return {
      labels: categoryData.map(d => d.category),
      datasets: [
        {
          label: 'Expenses by Category',
          data: categoryData.map(d => d.amount),
          backgroundColor: categoryData.map(
            (_, index) => this.COLORS.categoryPalette[index % this.COLORS.categoryPalette.length]
          ),
          borderColor: '#1e293b',
          borderWidth: 2
        }
      ]
    };
  }

  // ─── 4. PORTFOLIO DISTRIBUTION DOUGHNUT CHART ────────────────────────
  /**
   * getPortfolioChartData(investments)
   *
   * Creates data for a doughnut chart showing portfolio allocation:
   * How much % is in Stocks, Mutual Funds, ETFs, FDs, Gold.
   *
   * Used on: Dashboard, Investments page, Analytics page
   */
  getPortfolioChartData(investments: Investment[]): ChartConfig {
    const distribution = this.investmentService.getPortfolioDistribution(investments);

    // Map investment type to a specific color
    const typeColorMap: Record<string, string> = {
      'Stock':          this.COLORS.stock,
      'Mutual Fund':    this.COLORS.mf,
      'ETF':            this.COLORS.etf,
      'Fixed Deposit':  this.COLORS.fd,
      'Gold':           this.COLORS.gold
    };

    return {
      labels: distribution.map(d => d.type),
      datasets: [
        {
          label: 'Portfolio Distribution',
          data: distribution.map(d => d.value),
          backgroundColor: distribution.map(
            d => typeColorMap[d.type] ?? this.COLORS.categoryPalette[0]
          ),
          borderColor: '#1e293b',
          borderWidth: 2
        }
      ]
    };
  }

  // ─── 5. INVESTMENT PROFIT/LOSS BAR CHART ─────────────────────────────
  /**
   * getProfitLossChartData(investments)
   *
   * Creates a bar chart showing profit or loss for each investment.
   * Green bar = profit, Red bar = loss.
   *
   * Used on: Analytics page, Investments page
   */
  getProfitLossChartData(investments: Investment[]): ChartConfig {
    return {
      labels: investments.map(i => i.name),
      datasets: [
        {
          label: 'Profit / Loss (₹)',
          data: investments.map(i => this.investmentService.getProfitLoss(i)),
          backgroundColor: investments.map(i =>
            this.investmentService.getProfitLoss(i) >= 0
              ? this.hexToRgba(this.COLORS.profit, 0.85)
              : this.hexToRgba(this.COLORS.loss, 0.85)
          ),
          borderColor: investments.map(i =>
            this.investmentService.getProfitLoss(i) >= 0
              ? this.COLORS.profit
              : this.COLORS.loss
          ),
          borderWidth: 2
        }
      ]
    };
  }

  // ─── 6. MONTHLY EXPENSE BAR CHART ────────────────────────────────────
  /**
   * getMonthlyExpenseChartData(transactions)
   *
   * Simple bar chart showing only monthly expenses (no income).
   * Used on: Income & Expenses page
   */
  getMonthlyExpenseChartData(transactions: Transaction[]): ChartConfig {
    const monthlyData = this.transactionService.getMonthlyData(transactions);

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Monthly Expenses',
          data: monthlyData.map(d => d.expense),
          backgroundColor: this.hexToRgba(this.COLORS.expense, 0.8),
          borderColor: this.COLORS.expense,
          borderWidth: 2
        }
      ]
    };
  }

  // ─── HELPER: Format currency for display ─────────────────────────────
  /**
   * formatCurrency(amount) — Formats a number as Indian Rupee string
   * Example: 85000 → "₹85,000"
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // ─── PRIVATE HELPER: Hex to RGBA ─────────────────────────────────────
  /**
   * hexToRgba('#10b981', 0.85) → 'rgba(16, 185, 129, 0.85)'
   * Chart.js uses rgba() for semi-transparent fills.
   */
  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

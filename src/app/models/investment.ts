/**
 * investment.ts — Investment Model
 *
 * This interface describes the shape of an investment in our portfolio.
 * Investments can be Stocks, Mutual Funds, ETFs, Fixed Deposits, or Gold.
 *
 * SIMPLE EXPLANATION:
 * When you invest money (e.g. buy Infosys shares or put money in an FD),
 * that investment is tracked using this interface.
 *
 * KEY CALCULATIONS (you will see these everywhere in the app):
 *   Profit/Loss     = currentValue - investedAmount
 *   Return %        = (Profit/Loss / investedAmount) × 100
 *
 * Example:
 *   investedAmount = 50,000
 *   currentValue   = 67,500
 *   Profit/Loss    = 67,500 - 50,000 = +17,500  ← profit!
 *   Return %       = (17,500 / 50,000) × 100   = +35%
 */

export interface Investment {
  id: string;             // Unique identifier (e.g. "i1", "i2", ...)
  userId: string;         // Which user owns this investment (links to User.id)
  name: string;           // Investment name (e.g. "Infosys Ltd.", "Nifty 50 ETF")
  type: InvestmentType;   // One of the 5 allowed types (see below)
  symbol: string;         // Short code / ticker (e.g. "INFY", "TCS", "SGB2026")
  investedAmount: number; // Money originally invested (e.g. 50000)
  currentValue: number;   // Current market value today (e.g. 67500)
  units: number;          // Number of shares / units / grams (e.g. 30 shares)
  purchasePrice: number;  // Price per unit when bought (e.g. 1666.67)
  currentPrice: number;   // Current price per unit today (e.g. 2250)
  purchaseDate: string;   // Date of purchase in YYYY-MM-DD format
  sector: string;         // Sector or category (e.g. "Information Technology")
  description: string;    // Notes about this investment
}

/**
 * InvestmentType — the 5 allowed investment types
 *
 * Using a TypeScript "type alias" ensures we only ever use
 * one of these exact strings — prevents typos like "stock" or "STOCK".
 */
export type InvestmentType =
  | 'Stock'
  | 'Mutual Fund'
  | 'ETF'
  | 'Fixed Deposit'
  | 'Gold';

/**
 * All investment types as an array — used in dropdowns when adding/editing.
 */
export const INVESTMENT_TYPES: InvestmentType[] = [
  'Stock',
  'Mutual Fund',
  'ETF',
  'Fixed Deposit',
  'Gold'
];

/**
 * InvestmentSummary — computed summary for the dashboard & portfolio page
 *
 * This is NOT stored in db.json — it's calculated in our service.
 * Holds portfolio-level totals shown on the Dashboard and Investments page.
 */
export interface InvestmentSummary {
  totalInvested: number;    // Sum of all investedAmount values
  totalCurrentValue: number;// Sum of all currentValue values
  totalProfitLoss: number;  // totalCurrentValue - totalInvested
  returnPercentage: number; // (totalProfitLoss / totalInvested) × 100
}

/**
 * PortfolioDistribution — data for the portfolio pie chart
 *
 * Shows how much of the portfolio is in each investment type.
 * Example: { type: "Stock", value: 215000, percentage: 42 }
 */
export interface PortfolioDistribution {
  type: string;         // Investment type (e.g. "Stock", "Gold")
  value: number;        // Total current value in that type
  percentage: number;   // What % of total portfolio this type represents
}

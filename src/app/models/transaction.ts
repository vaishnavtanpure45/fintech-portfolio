/**
 * transaction.ts — Transaction Model
 *
 * This interface describes the shape of a financial transaction.
 * Transactions are either INCOME (money coming in) or EXPENSE (money going out).
 *
 * SIMPLE EXPLANATION:
 * When you spend money on groceries or receive your salary, that is a "transaction".
 * This interface tells Angular exactly what fields every transaction must have.
 *
 * Every transaction in db.json follows this exact structure.
 */

export interface Transaction {
  id: string;             // Unique identifier (e.g. "t1", "t2", ...)
  userId: string;         // Which user owns this transaction (links to User.id)
  title: string;          // Short name (e.g. "Monthly Salary", "House Rent")
  category: string;       // Category (e.g. "Salary", "Food", "Rent", "Transport")
  amount: number;         // The money value (e.g. 85000, 4200, 649)
  type: 'income' | 'expense'; // MUST be exactly "income" or "expense" — nothing else!
  date: string;           // Date of transaction in YYYY-MM-DD format (e.g. "2026-11-01")
  description: string;    // Longer explanation (e.g. "November salary from TechCorp")
}

/**
 * TransactionCategory — all allowed transaction categories
 *
 * This keeps our category names consistent everywhere in the app.
 * When adding/editing a transaction, we show these in a dropdown.
 *
 * INCOME categories:
 *   Salary, Freelance, Business, Dividend, Bonus, Gift, Other Income
 *
 * EXPENSE categories:
 *   Rent, Food, Transport, Utilities, Entertainment, Healthcare,
 *   Education, Shopping, Travel, Insurance, Investment, Other Expense
 */
export const INCOME_CATEGORIES: string[] = [
  'Salary',
  'Freelance',
  'Business',
  'Dividend',
  'Bonus',
  'Gift',
  'Other Income'
];

export const EXPENSE_CATEGORIES: string[] = [
  'Rent',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Shopping',
  'Travel',
  'Insurance',
  'Investment',
  'Other Expense'
];

/**
 * TransactionSummary — computed summary values for the dashboard
 *
 * This is NOT stored in db.json — it's calculated in our services.
 * It holds the totals we display on the Dashboard and Income/Expenses page.
 */
export interface TransactionSummary {
  totalIncome: number;    // Sum of all income transactions
  totalExpenses: number;  // Sum of all expense transactions
  netBalance: number;     // totalIncome - totalExpenses
}

/**
 * MonthlyData — data for monthly income/expense charts
 *
 * Used by the Analytics component to draw bar/line charts.
 * Example: { month: "Nov 2026", income: 110000, expense: 32000 }
 */
export interface MonthlyData {
  month: string;    // Human-readable month label (e.g. "Nov 2026")
  income: number;   // Total income in that month
  expense: number;  // Total expenses in that month
}

/**
 * CategoryData — data for the category pie/doughnut chart
 *
 * Used by Analytics to show which category spent the most money.
 * Example: { category: "Food", amount: 7000 }
 */
export interface CategoryData {
  category: string;   // Category name (e.g. "Rent", "Food")
  amount: number;     // Total amount spent in this category
}

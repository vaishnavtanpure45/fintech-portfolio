import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { InvestmentService } from '../../services/investment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Transaction } from '../../models/transaction';
import { Investment } from '../../models/investment';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private investmentService = inject(InvestmentService);
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);

  @ViewChild('incomeExpenseChart') incomeExpenseCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  transactions = signal<Transaction[]>([]);
  investments = signal<Investment[]>([]);
  totalIncome = signal(0);
  totalExpenses = signal(0);
  netBalance = signal(0);
  totalInvested = signal(0);
  totalCurrentValue = signal(0);
  totalPL = signal(0);
  returnPct = signal(0);
  recentTransactions = signal<Transaction[]>([]);

  private charts: Chart[] = [];
  private dataLoaded = 0;

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.transactionService.getTransactions(userId).subscribe(txns => {
      this.transactions.set(txns);
      const summary = this.transactionService.getSummary(txns);
      this.totalIncome.set(summary.totalIncome);
      this.totalExpenses.set(summary.totalExpenses);
      this.netBalance.set(summary.netBalance);
      this.recentTransactions.set(this.transactionService.getRecentTransactions(txns, 5));
      this.dataLoaded++;
      if (this.dataLoaded === 2) this.buildCharts();
    });

    this.investmentService.getInvestments(userId).subscribe(invs => {
      this.investments.set(invs);
      const summary = this.investmentService.getSummary(invs);
      this.totalInvested.set(summary.totalInvested);
      this.totalCurrentValue.set(summary.totalCurrentValue);
      this.totalPL.set(summary.totalProfitLoss);
      this.returnPct.set(summary.returnPercentage);
      this.dataLoaded++;
      if (this.dataLoaded === 2) this.buildCharts();
    });
  }

  private buildCharts(): void {
    setTimeout(() => {
      if (this.incomeExpenseCanvas) {
        const data = this.analyticsService.getIncomeExpenseChartData(this.transactions());
        this.charts.push(new Chart(this.incomeExpenseCanvas.nativeElement, {
          type: 'bar',
          data: data,
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } }
        }));
      }
      if (this.categoryCanvas) {
        const data = this.analyticsService.getCategoryChartData(this.transactions());
        this.charts.push(new Chart(this.categoryCanvas.nativeElement, {
          type: 'doughnut',
          data: data,
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 12, usePointStyle: true } } } }
        }));
      }
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  }

  navigateTo(path: string): void { this.router.navigate([path]); }

  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}

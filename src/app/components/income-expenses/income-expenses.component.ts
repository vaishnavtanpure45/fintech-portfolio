import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Transaction } from '../../models/transaction';

Chart.register(...registerables);

@Component({
  selector: 'app-income-expenses',
  imports: [DatePipe],
  templateUrl: './income-expenses.component.html',
  styleUrl: './income-expenses.component.css'
})
export class IncomeExpensesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private txnService = inject(TransactionService);
  private analyticsService = inject(AnalyticsService);

  @ViewChild('ieChart') ieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expChart') expCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catChart') catCanvas!: ElementRef<HTMLCanvasElement>;

  totalIncome = signal(0);
  totalExpenses = signal(0);
  netBalance = signal(0);
  incomeList = signal<Transaction[]>([]);
  expenseList = signal<Transaction[]>([]);
  activeTab = signal<'income' | 'expense'>('income');
  private charts: Chart[] = [];

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    this.txnService.getTransactions(userId).subscribe(txns => {
      const s = this.txnService.getSummary(txns);
      this.totalIncome.set(s.totalIncome);
      this.totalExpenses.set(s.totalExpenses);
      this.netBalance.set(s.netBalance);
      this.incomeList.set(txns.filter(t => t.type === 'income'));
      this.expenseList.set(txns.filter(t => t.type === 'expense'));
      setTimeout(() => this.buildCharts(txns));
    });
  }

  private buildCharts(txns: Transaction[]): void {
    if (this.ieCanvas) {
      const d = this.analyticsService.getIncomeExpenseChartData(txns);
      this.charts.push(new Chart(this.ieCanvas.nativeElement, { type: 'bar', data: d, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } } }));
    }
    if (this.expCanvas) {
      const d = this.analyticsService.getMonthlyExpenseChartData(txns);
      this.charts.push(new Chart(this.expCanvas.nativeElement, { type: 'bar', data: d, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } } } }));
    }
    if (this.catCanvas) {
      const d = this.analyticsService.getCategoryChartData(txns);
      this.charts.push(new Chart(this.catCanvas.nativeElement, { type: 'doughnut', data: d, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 10, usePointStyle: true } } } } }));
    }
  }

  fmt(n: number): string { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}

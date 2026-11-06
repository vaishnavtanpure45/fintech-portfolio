import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { InvestmentService } from '../../services/investment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Transaction } from '../../models/transaction';
import { Investment } from '../../models/investment';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  imports: [],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private txnService = inject(TransactionService);
  private invService = inject(InvestmentService);
  private analyticsService = inject(AnalyticsService);

  @ViewChild('ieChart') ieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('balChart') balCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catChart') catCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('portChart') portCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('plChart') plCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expChart') expCanvas!: ElementRef<HTMLCanvasElement>;

  totalIncome = signal(0); totalExpenses = signal(0); netBalance = signal(0);
  totalInvested = signal(0); totalPL = signal(0);
  private charts: Chart[] = [];
  private loaded = 0;
  private txns: Transaction[] = [];
  private invs: Investment[] = [];

  ngOnInit(): void {
    const uid = this.authService.getCurrentUserId();
    this.txnService.getTransactions(uid).subscribe(t => { this.txns = t; const s = this.txnService.getSummary(t); this.totalIncome.set(s.totalIncome); this.totalExpenses.set(s.totalExpenses); this.netBalance.set(s.netBalance); this.loaded++; if (this.loaded === 2) this.buildAll(); });
    this.invService.getInvestments(uid).subscribe(i => { this.invs = i; const s = this.invService.getSummary(i); this.totalInvested.set(s.totalInvested); this.totalPL.set(s.totalProfitLoss); this.loaded++; if (this.loaded === 2) this.buildAll(); });
  }

  private buildAll(): void {
    setTimeout(() => {
      this.makeChart(this.ieCanvas, 'bar', this.analyticsService.getIncomeExpenseChartData(this.txns));
      this.makeChart(this.balCanvas, 'line', this.analyticsService.getNetBalanceChartData(this.txns));
      this.makeChart(this.catCanvas, 'doughnut', this.analyticsService.getCategoryChartData(this.txns));
      this.makeChart(this.portCanvas, 'doughnut', this.analyticsService.getPortfolioChartData(this.invs));
      this.makeChart(this.plCanvas, 'bar', this.analyticsService.getProfitLossChartData(this.invs));
      this.makeChart(this.expCanvas, 'bar', this.analyticsService.getMonthlyExpenseChartData(this.txns));
    });
  }

  private makeChart(ref: ElementRef<HTMLCanvasElement> | undefined, type: any, data: any): void {
    if (!ref) return;
    const isDoughnut = type === 'doughnut';
    const opts: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: isDoughnut ? 'right' : 'top', labels: { color: '#94a3b8', padding: 10, usePointStyle: isDoughnut } } } };
    if (!isDoughnut) { opts.scales = { x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } } }; }
    this.charts.push(new Chart(ref.nativeElement, { type, data, options: opts }));
  }

  fmt(n: number): string { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
  ngOnDestroy(): void { this.charts.forEach(c => c.destroy()); }
}

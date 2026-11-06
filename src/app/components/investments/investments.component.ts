import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { InvestmentService } from '../../services/investment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Investment, INVESTMENT_TYPES } from '../../models/investment';

Chart.register(...registerables);

@Component({
  selector: 'app-investments',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css'
})
export class InvestmentsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private invService = inject(InvestmentService);
  private analyticsService = inject(AnalyticsService);
  private fb = inject(FormBuilder);

  @ViewChild('portfolioChart') portfolioCanvas!: ElementRef<HTMLCanvasElement>;

  investments = signal<Investment[]>([]);
  totalInvested = signal(0); totalCurrent = signal(0); totalPL = signal(0); returnPct = signal(0);
  showModal = signal(false); editMode = signal(false); editId = signal('');
  showDeleteConfirm = signal(false); deleteId = signal('');
  isLoading = signal(false); successMsg = signal('');
  investmentTypes = INVESTMENT_TYPES;

  invForm!: FormGroup;
  private chart: Chart | null = null;

  ngOnInit(): void {
    this.invForm = this.fb.group({
      name: ['', [Validators.required]], type: ['Stock', Validators.required], symbol: ['', Validators.required],
      investedAmount: [null, [Validators.required, Validators.min(1)]], currentValue: [null, [Validators.required, Validators.min(0)]],
      units: [null, [Validators.required, Validators.min(0.01)]], purchasePrice: [null, [Validators.required, Validators.min(0.01)]],
      currentPrice: [null, [Validators.required, Validators.min(0)]], purchaseDate: ['', Validators.required],
      sector: [''], description: ['']
    });
    this.loadData();
  }

  private loadData(): void {
    this.invService.getInvestments(this.authService.getCurrentUserId()).subscribe(invs => {
      this.investments.set(invs);
      const s = this.invService.getSummary(invs);
      this.totalInvested.set(s.totalInvested); this.totalCurrent.set(s.totalCurrentValue);
      this.totalPL.set(s.totalProfitLoss); this.returnPct.set(s.returnPercentage);
      setTimeout(() => this.buildChart(invs));
    });
  }

  private buildChart(invs: Investment[]): void {
    if (this.chart) this.chart.destroy();
    if (this.portfolioCanvas && invs.length > 0) {
      const d = this.analyticsService.getPortfolioChartData(invs);
      this.chart = new Chart(this.portfolioCanvas.nativeElement, { type: 'doughnut', data: d, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', padding: 12, usePointStyle: true } } } } });
    }
  }

  getPL(i: Investment): number { return this.invService.getProfitLoss(i); }
  getRetPct(i: Investment): number { return this.invService.getReturnPercentage(i); }
  fmt(n: number): string { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }

  openAdd(): void {
    this.editMode.set(false); this.editId.set('');
    this.invForm.reset({ type: 'Stock', purchaseDate: new Date().toISOString().split('T')[0] });
    this.showModal.set(true);
  }

  openEdit(i: Investment): void {
    this.editMode.set(true); this.editId.set(i.id);
    this.invForm.patchValue({ name: i.name, type: i.type, symbol: i.symbol, investedAmount: i.investedAmount, currentValue: i.currentValue, units: i.units, purchasePrice: i.purchasePrice, currentPrice: i.currentPrice, purchaseDate: i.purchaseDate, sector: i.sector, description: i.description });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.invForm.invalid) { this.invForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    const val = this.invForm.value; const userId = this.authService.getCurrentUserId();
    if (this.editMode()) {
      this.invService.updateInvestment(this.editId(), { ...val, id: this.editId(), userId }).subscribe({ next: () => this.done('Investment updated!'), error: () => this.isLoading.set(false) });
    } else {
      this.invService.addInvestment({ ...val, userId }).subscribe({ next: () => this.done('Investment added!'), error: () => this.isLoading.set(false) });
    }
  }

  confirmDelete(id: string): void { this.deleteId.set(id); this.showDeleteConfirm.set(true); }
  cancelDelete(): void { this.showDeleteConfirm.set(false); }
  onDelete(): void { this.invService.deleteInvestment(this.deleteId()).subscribe({ next: () => { this.showDeleteConfirm.set(false); this.done('Investment deleted!'); } }); }

  private done(msg: string): void { this.isLoading.set(false); this.showModal.set(false); this.successMsg.set(msg); setTimeout(() => this.successMsg.set(''), 3000); this.loadData(); }

  getTypeBadgeClass(type: string): string {
    const map: Record<string, string> = { 'Stock': 'bt-indigo', 'Mutual Fund': 'bt-blue', 'ETF': 'bt-amber', 'Fixed Deposit': 'bt-green', 'Gold': 'bt-orange' };
    return map[type] || 'bt-indigo';
  }

  ngOnDestroy(): void { if (this.chart) this.chart.destroy(); }
}

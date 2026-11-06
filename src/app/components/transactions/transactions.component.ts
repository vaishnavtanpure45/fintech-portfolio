import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../models/transaction';

@Component({
  selector: 'app-transactions',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit {
  private authService = inject(AuthService);
  private txnService = inject(TransactionService);
  private fb = inject(FormBuilder);

  transactions = signal<Transaction[]>([]);
  filtered = signal<Transaction[]>([]);
  totalIncome = signal(0);
  totalExpenses = signal(0);
  netBalance = signal(0);

  showModal = signal(false);
  editMode = signal(false);
  editId = signal('');
  showDeleteConfirm = signal(false);
  deleteId = signal('');
  searchTerm = signal('');
  filterType = signal<'all' | 'income' | 'expense'>('all');
  isLoading = signal(false);
  successMsg = signal('');

  txnForm!: FormGroup;
  categories = signal<string[]>([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]);

  ngOnInit(): void {
    this.txnForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      type: ['expense', Validators.required],
      date: ['', Validators.required],
      description: ['']
    });
    this.txnForm.get('type')!.valueChanges.subscribe(t => {
      this.categories.set(t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);
      this.txnForm.get('category')!.setValue('');
    });
    this.loadData();
  }

  private loadData(): void {
    const userId = this.authService.getCurrentUserId();
    this.txnService.getTransactions(userId).subscribe(txns => {
      this.transactions.set(txns);
      const s = this.txnService.getSummary(txns);
      this.totalIncome.set(s.totalIncome);
      this.totalExpenses.set(s.totalExpenses);
      this.netBalance.set(s.netBalance);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = this.transactions();
    const term = this.searchTerm().toLowerCase();
    if (term) result = result.filter(t => t.title.toLowerCase().includes(term) || t.category.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
    const ft = this.filterType();
    if (ft !== 'all') result = result.filter(t => t.type === ft);
    this.filtered.set(result);
  }

  onSearch(event: Event): void { this.searchTerm.set((event.target as HTMLInputElement).value); this.applyFilters(); }
  onFilterType(type: 'all' | 'income' | 'expense'): void { this.filterType.set(type); this.applyFilters(); }

  openAdd(): void {
    this.editMode.set(false);
    this.editId.set('');
    this.txnForm.reset({ type: 'expense', date: new Date().toISOString().split('T')[0] });
    this.categories.set(EXPENSE_CATEGORIES);
    this.showModal.set(true);
  }

  openEdit(t: Transaction): void {
    this.editMode.set(true);
    this.editId.set(t.id);
    this.categories.set(t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);
    this.txnForm.patchValue({ title: t.title, category: t.category, amount: t.amount, type: t.type, date: t.date, description: t.description });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSubmit(): void {
    if (this.txnForm.invalid) { this.txnForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    const val = this.txnForm.value;
    const userId = this.authService.getCurrentUserId();

    if (this.editMode()) {
      this.txnService.updateTransaction(this.editId(), { ...val, id: this.editId(), userId }).subscribe({ next: () => { this.done('Transaction updated!'); }, error: () => this.isLoading.set(false) });
    } else {
      this.txnService.addTransaction({ ...val, userId }).subscribe({ next: () => { this.done('Transaction added!'); }, error: () => this.isLoading.set(false) });
    }
  }

  confirmDelete(id: string): void { this.deleteId.set(id); this.showDeleteConfirm.set(true); }
  cancelDelete(): void { this.showDeleteConfirm.set(false); }
  onDelete(): void {
    this.txnService.deleteTransaction(this.deleteId()).subscribe({ next: () => { this.showDeleteConfirm.set(false); this.done('Transaction deleted!'); } });
  }

  private done(msg: string): void {
    this.isLoading.set(false);
    this.showModal.set(false);
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
    this.loadData();
  }

  fmt(n: number): string { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
}

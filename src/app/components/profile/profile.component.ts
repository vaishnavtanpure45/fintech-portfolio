import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  userInitials = computed(() => { const n = this.currentUser()?.fullName ?? ''; return n.split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase()).slice(0, 2).join(''); });

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  showPwdSection = signal(false);

  ngOnInit(): void {
    const u = this.currentUser();
    this.profileForm = this.fb.group({
      fullName: [u?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
      email: [u?.email ?? '', [Validators.required, Validators.email]],
      phone: [u?.phone ?? ''],
      occupation: [u?.occupation ?? ''],
      currency: [u?.currency ?? 'INR']
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isLoading.set(true); this.errorMsg.set('');
    const u = this.currentUser();
    if (!u) return;
    this.authService.updateProfile(u.id, this.profileForm.value).subscribe({
      next: () => { this.isLoading.set(false); this.successMsg.set('Profile updated!'); setTimeout(() => this.successMsg.set(''), 3000); },
      error: (e: Error) => { this.isLoading.set(false); this.errorMsg.set(e.message); }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const v = this.passwordForm.value;
    const u = this.currentUser();
    if (!u) return;
    if (v.currentPassword !== u.password) { this.errorMsg.set('Current password is incorrect.'); return; }
    if (v.newPassword !== v.confirmPassword) { this.errorMsg.set('New passwords do not match.'); return; }
    this.isLoading.set(true); this.errorMsg.set('');
    this.authService.updateProfile(u.id, { password: v.newPassword }).subscribe({
      next: () => { this.isLoading.set(false); this.successMsg.set('Password changed!'); this.passwordForm.reset(); this.showPwdSection.set(false); setTimeout(() => this.successMsg.set(''), 3000); },
      error: (e: Error) => { this.isLoading.set(false); this.errorMsg.set(e.message); }
    });
  }
}

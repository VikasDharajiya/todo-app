import { Component, inject, signal, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-reset-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './reset-password-form.component.html',
})
export class ResetPasswordFormComponent {
  supabaseService = inject(SupabaseService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  @Output() errorOccurred = new EventEmitter<string>();
  @Output() resetSuccess = new EventEmitter<void>();

  isLoading = signal<boolean>(false);

  // Form controls for setting a new password
  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  // Custom validator to ensure passwords match
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Handle password update
  async handleResetPassword() {
    if (this.resetForm.invalid) {
      this.errorOccurred.emit('Please check the input values.');
      this.toastService.show('Form validation failed', 'error');
      return;
    }

    const { password } = this.resetForm.value;
    try {
      this.isLoading.set(true);
      this.errorOccurred.emit('');

      // Update password in Supabase
      const { error } = await this.supabaseService.updatePassword(password);

      this.ngZone.run(() => {
        if (error) {
          this.errorOccurred.emit(error.message);
          this.toastService.show('Failed to update password: ' + error.message, 'error');
        } else {
          this.toastService.show('Password updated successfully! Redirecting...', 'success');
          this.resetSuccess.emit();
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred.');
        this.toastService.show('Failed to reset: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }
}

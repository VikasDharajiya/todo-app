import { Component, inject, signal, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './forgot-password-form.component.html',
})
export class ForgotPasswordFormComponent {
  // Inject required services for auth operations
  supabaseService = inject(SupabaseService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  // Event emitters to notify the parent auth container of actions and errors
  @Output() errorOccurred = new EventEmitter<string>();
  @Output() backToLogin = new EventEmitter<void>();

  // State signals
  isLoading = signal<boolean>(false);
  isEmailSent = signal<boolean>(false);

  // Reactive form for forgot password
  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  formatAuthError(message: string): string {
    if (!message) return '';
    const lower = message.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'For security reasons, you can only request this once every 60 seconds. Please wait a minute and try again.';
    }
    if (lower.includes('user not found')) {
      return 'No account was found with this email address.';
    }
    return message;
  }

  // Submits the email address to Supabase to trigger a password reset email
  async handleForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      this.errorOccurred.emit('Please provide a valid email address.');
      this.toastService.show('Form validation failed', 'error');
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    try {
      this.isLoading.set(true);
      this.errorOccurred.emit('');

      // Call supabase service to trigger reset
      const { error } = await this.supabaseService.resetPassword(email);

      this.ngZone.run(() => {
        if (error) {
          const formatted = this.formatAuthError(error.message);
          this.errorOccurred.emit(formatted);
          this.toastService.show('Reset failed: ' + formatted, 'error');
        } else {
          this.isEmailSent.set(true);
          this.toastService.show('Password reset email sent!', 'success');
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred.');
        this.toastService.show('Reset failed: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }
}

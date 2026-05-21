import { Component, Input, inject, signal, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  supabaseService = inject(SupabaseService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  @Output() errorOccurred = new EventEmitter<string>();
  @Output() forgotPassword = new EventEmitter<void>();

  isLoading = signal<boolean>(false);
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  @Input() set initialEmail(val: string) {
    if (val && this.loginForm) {
      this.loginForm.patchValue({ email: val });
    }
  }

  async handleLogin() {
    if (this.loginForm.invalid) {
      this.errorOccurred.emit('Please provide a valid email and password.');
      this.toastService.show('Form validation failed', 'error');
      return;
    }

    const { email, password } = this.loginForm.value;
    try {
      this.isLoading.set(true);
      this.errorOccurred.emit('');
      const { error } = await this.supabaseService.signIn(email, password);

      this.ngZone.run(() => {
        if (error) {
          this.errorOccurred.emit(error.message);
          this.toastService.show('Failed to log in: ' + error.message, 'error');
        } else {
          this.toastService.show('Logged in successfully!', 'success');
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred.');
        this.toastService.show('Failed to log in: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }
}

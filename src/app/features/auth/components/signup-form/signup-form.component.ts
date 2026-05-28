import { Component, inject, signal, Output, EventEmitter, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SpinnerComponent],
  templateUrl: './signup-form.component.html',
})
export class SignUpFormComponent implements OnInit, OnDestroy {
  supabaseService = inject(SupabaseService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  @Output() errorOccurred = new EventEmitter<string>();
  @Output() signUpSuccess = new EventEmitter<string>();

  isLoading = signal<boolean>(false);
  signUpForm!: FormGroup;

  ngOnInit() {
    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', [Validators.required]],
      orgName: [''],
      orgId: ['', [Validators.required]], // Default role is user, so orgId is required
    });

    // Listen to role changes to update conditional validators
    this.signUpForm.get('role')?.valueChanges.subscribe((role) => {
      const orgNameControl = this.signUpForm.get('orgName');
      const orgIdControl = this.signUpForm.get('orgId');

      if (role === 'admin') {
        orgNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
        orgIdControl?.clearValidators();
      } else {
        orgIdControl?.setValidators([Validators.required]);
        orgNameControl?.clearValidators();
      }

      orgNameControl?.updateValueAndValidity();
      orgIdControl?.updateValueAndValidity();
    });
  }

  isOtpMode = signal<boolean>(false);
  registeredEmail = signal<string>('');
  otpCode = signal<string>('');
  otpLoading = signal<boolean>(false);
  resendCooldown = signal<number>(0);
  cooldownTimer: any;

  ngOnDestroy() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  formatAuthError(message: string): string {
    if (!message) return '';
    const lower = message.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'For security reasons, you can only request this once every 60 seconds. Please wait a minute and try again.';
    }
    if (lower.includes('invalid flow state') || lower.includes('signup confirmation not enabled')) {
      return 'Signup confirmation is not fully enabled. Please contact support or try logging in.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'An account with this email address already exists. Try signing in instead.';
    }
    if (lower.includes('token is invalid') || lower.includes('otp') || lower.includes('verification code') || lower.includes('code is invalid')) {
      return 'The verification code entered is invalid or has expired. Please check and try again.';
    }
    return message;
  }

  async handleSignUp() {
    if (this.signUpForm.invalid) {
      this.errorOccurred.emit('Please fill out all required signup details correctly.');
      this.toastService.show('Validation errors exist.', 'error');
      return;
    }

    const { email, password, role, orgName, orgId } = this.signUpForm.value;
    try {
      this.isLoading.set(true);
      this.errorOccurred.emit('');
      const { data, error } = await this.supabaseService.signUp(
        email,
        password,
        role,
        role === 'admin' ? orgName : undefined,
        role === 'user' ? orgId : undefined
      );

      this.ngZone.run(() => {
        if (error) {
          const formatted = this.formatAuthError(error.message);
          this.errorOccurred.emit(formatted);
          this.toastService.show('Failed to register: ' + formatted, 'error');
        } else {
          if (data?.user && !data?.session) {
            this.registeredEmail.set(email);
            this.isOtpMode.set(true);
            this.startResendCooldown();
            this.toastService.show('Verification code sent! Please verify your email.', 'info');
          } else {
            this.toastService.show('Account created successfully! Log in to join.', 'success');
            this.signUpSuccess.emit(email);
          }
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred.');
        this.toastService.show('Failed to register: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }

  async handleVerifyOtp() {
    const code = this.otpCode().trim();
    if (code.length !== 6) {
      this.errorOccurred.emit('Please enter the 6-digit verification code.');
      this.toastService.show('Verification code must be 6 digits.', 'error');
      return;
    }

    try {
      this.otpLoading.set(true);
      this.errorOccurred.emit('');
      const { error } = await this.supabaseService.verifyOtp(this.registeredEmail(), code, 'signup');

      this.ngZone.run(() => {
        if (error) {
          const formatted = this.formatAuthError(error.message);
          this.errorOccurred.emit(formatted);
          this.toastService.show('Verification failed: ' + formatted, 'error');
        } else {
          this.toastService.show('Email verified successfully! Opening workspace...', 'success');
          // Note: Supabase establishes a session which reactively routes to /board via onAuthStateChange
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred during verification.');
        this.toastService.show('Verification failed: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.otpLoading.set(false);
      });
    }
  }

  async handleResendOtp() {
    if (this.resendCooldown() > 0) return;

    try {
      this.errorOccurred.emit('');
      const { error } = await this.supabaseService.resendOtp(this.registeredEmail(), 'signup');

      this.ngZone.run(() => {
        if (error) {
          const formatted = this.formatAuthError(error.message);
          this.errorOccurred.emit(formatted);
          this.toastService.show('Resend failed: ' + formatted, 'error');
        } else {
          this.toastService.show('Verification code resent successfully!', 'success');
          this.startResendCooldown();
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorOccurred.emit('An unexpected error occurred.');
        this.toastService.show('Failed to resend code.', 'error');
      });
    }
  }

  cancelOtpMode() {
    this.isOtpMode.set(false);
    this.otpCode.set('');
    this.errorOccurred.emit('');
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.resendCooldown.set(0);
    }
  }

  startResendCooldown() {
    this.resendCooldown.set(60);
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.cooldownTimer = setInterval(() => {
      this.ngZone.run(() => {
        const val = this.resendCooldown();
        if (val <= 1) {
          this.resendCooldown.set(0);
          clearInterval(this.cooldownTimer);
        } else {
          this.resendCooldown.set(val - 1);
        }
      });
    }, 1000);
  }
}

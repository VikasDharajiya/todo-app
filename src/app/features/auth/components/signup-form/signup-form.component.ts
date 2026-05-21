import { Component, inject, signal, Output, EventEmitter, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './signup-form.component.html',
})
export class SignUpFormComponent implements OnInit {
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
          this.errorOccurred.emit(error.message);
          this.toastService.show('Failed to register: ' + error.message, 'error');
        } else {
          if (data?.user && !data?.session) {
            this.toastService.show('Registration successful! Please verify your email to log in.', 'info');
          } else {
            this.toastService.show('Account created successfully! Log in to join.', 'success');
          }
          this.signUpSuccess.emit(email);
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
}

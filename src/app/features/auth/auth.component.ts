import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { SignUpFormComponent } from './components/signup-form/signup-form.component';
import { ForgotPasswordFormComponent } from './components/forgot-password-form/forgot-password-form.component';
import { ResetPasswordFormComponent } from './components/reset-password-form/reset-password-form.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, 
    LoginFormComponent, 
    SignUpFormComponent, 
    ForgotPasswordFormComponent,
    ResetPasswordFormComponent
  ],
  templateUrl: './auth.component.html',
})
export class AuthComponent implements OnInit {
  workspaceService = inject(WorkspaceService);
  router = inject(Router);

  isDarkMode = this.workspaceService.isDarkMode;
  activeAuthTab = signal<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');
  authErrorMsg = signal<string>('');
  registeredEmail = signal<string>('');

  ngOnInit() {
    // If the app caught a PASSWORD_RECOVERY event, show the reset password form
    if (this.workspaceService.isPasswordRecoveryMode()) {
      this.activeAuthTab.set('reset-password');
    }
  }

  toggleTheme() {
    this.workspaceService.toggleTheme();
  }

  setTab(tab: 'login' | 'signup' | 'forgot-password' | 'reset-password') {
    this.activeAuthTab.set(tab);
    this.authErrorMsg.set('');
  }

  onSignUpSuccess(email: string) {
    this.registeredEmail.set(email);
    this.setTab('login');
  }

  onResetSuccess() {
    this.workspaceService.isPasswordRecoveryMode.set(false);
    this.router.navigate(['/board']);
  }

  onErrorOccurred(msg: string) {
    this.authErrorMsg.set(msg);
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { SignUpFormComponent } from './components/signup-form/signup-form.component';
import { ForgotPasswordFormComponent } from './components/forgot-password-form/forgot-password-form.component';
import { ResetPasswordFormComponent } from './components/reset-password-form/reset-password-form.component';

export interface Milestone {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  progress?: number;
}

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

  // Interactive Sprint Milestone Roadmap State
  milestones = signal<Milestone[]>([
    { id: 1, title: 'Database Engine Setup', description: 'Configure pooling and replica sync controls.', status: 'completed' },
    { id: 2, title: 'Real-time Coordination', description: 'Integrate workspace sprint updates.', status: 'in-progress', progress: 65 },
    { id: 3, title: 'Tailwind Theme Overrides', description: 'Apply slate dark theme guidelines.', status: 'planned' }
  ]);

  ngOnInit() {
    // If the app caught a PASSWORD_RECOVERY event, show the reset password form
    if (this.workspaceService.isPasswordRecoveryMode()) {
      this.activeAuthTab.set('reset-password');
    }
  }

  cycleMilestone(id: number) {
    this.milestones.update(items => items.map(item => {
      if (item.id === id) {
        let newStatus: 'completed' | 'in-progress' | 'planned';
        let progress = undefined;
        if (item.status === 'planned') {
          newStatus = 'in-progress';
          progress = 25;
        } else if (item.status === 'in-progress') {
          newStatus = 'completed';
        } else {
          newStatus = 'planned';
        }
        return { ...item, status: newStatus, progress };
      }
      return item;
    }));
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

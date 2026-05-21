import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';
import { WorkspaceService } from './core/services/workspace.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  router = inject(Router);
  supabaseService = inject(SupabaseService);
  workspaceService = inject(WorkspaceService);
  ngZone = inject(NgZone);

  isDarkMode = this.workspaceService.isDarkMode;

  async ngOnInit() {
    this.workspaceService.initTheme();

    // Subscribe to auth state changes reactively
    this.supabaseService.onAuthStateChange((event, session) => {
      this.ngZone.run(async () => {
        const user = session?.user || null;
        this.workspaceService.currentUser.set(user);

        if (event === 'PASSWORD_RECOVERY') {
          this.workspaceService.isPasswordRecoveryMode.set(true);
          this.router.navigate(['/auth']);
          return;
        }

        if (user) {
          await this.workspaceService.loadProfileAndWorkspace();
          
          const currentUrl = this.router.url;
          if (currentUrl.includes('/auth') || currentUrl === '/' || currentUrl === '') {
            if (!this.workspaceService.isPasswordRecoveryMode()) {
              this.router.navigate(['/board']);
            }
          }
        } else {
          this.workspaceService.clear();
          this.router.navigate(['/auth']);
        }
      });
    });
  }
}

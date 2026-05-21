import { Component, inject, signal, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { WorkspaceService } from '../../core/services/workspace.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  router = inject(Router);
  supabaseService = inject(SupabaseService);
  workspaceService = inject(WorkspaceService);
  ngZone = inject(NgZone);

  currentUser = this.workspaceService.currentUser;
  currentUserProfile = this.workspaceService.currentUserProfile;
  organization = this.workspaceService.organization;
  isDarkMode = this.workspaceService.isDarkMode;

  isMobileMenuOpen = signal<boolean>(false);
  private realtimeSub: any = null;

  async ngOnInit() {
    // Close mobile menu on page transitions
    this.router.events.subscribe(() => {
      this.isMobileMenuOpen.set(false);
    });

    // Check session
    if (this.currentUser()) {
      this.setupRealtimeSubscription();
    }
  }

  ngOnDestroy() {
    this.unsubscribeRealtime();
  }

  setupRealtimeSubscription() {
    this.unsubscribeRealtime();
    this.realtimeSub = this.supabaseService.subscribeToTodos(() => {
      this.ngZone.run(async () => {
        await this.workspaceService.loadTodos();
      });
    });
  }

  unsubscribeRealtime() {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
      this.realtimeSub = null;
    }
  }

  toggleTheme() {
    this.workspaceService.toggleTheme();
  }

  async logout() {
    await this.supabaseService.signOut();
    this.ngZone.run(() => {
      this.workspaceService.clear();
      this.unsubscribeRealtime();
      this.router.navigate(['/auth']);
    });
  }
}

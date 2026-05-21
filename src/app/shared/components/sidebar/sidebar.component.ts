import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ProfileModalComponent } from './components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() organization: any = null;
  @Input() currentUser: any = null;
  @Input() currentUserProfile: any = null;
  @Input() isMobileOpen: boolean = false;

  @Output() logout = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  workspaceService = inject(WorkspaceService);

  showProfileModal = signal<boolean>(false);

  openEditProfile() {
    this.showProfileModal.set(true);
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
  }
}

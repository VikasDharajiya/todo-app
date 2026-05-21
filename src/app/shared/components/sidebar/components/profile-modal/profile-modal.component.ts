import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../../core/services/supabase.service';
import { WorkspaceService } from '../../../../../core/services/workspace.service';
import { ToastService } from '../../../toast/toast.service';
import { ModalComponent } from '../../../modal/modal.component';
import { SpinnerComponent } from '../../../spinner/spinner.component';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SpinnerComponent],
  templateUrl: './profile-modal.component.html',
})
export class ProfileModalComponent implements OnInit, OnChanges {
  @Input() currentUser: any = null;
  @Input() currentUserProfile: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  supabaseService = inject(SupabaseService);
  workspaceService = inject(WorkspaceService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  isUploading = signal<boolean>(false);
  uploadedAvatarUrl = signal<string | null>(null);
  profileForm!: FormGroup;

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentUserProfile'] && this.currentUserProfile) {
      this.initForm();
      this.uploadedAvatarUrl.set(this.currentUserProfile.avatar_url);
    }
  }

  initForm() {
    const defaultUsername = this.currentUserProfile?.username || 
      (this.currentUserProfile?.email ? this.currentUserProfile.email.split('@')[0] : '');

    this.profileForm = this.fb.group({
      username: [defaultUsername, [Validators.required, Validators.minLength(2)]],
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.show('Please select a valid image file.', 'error');
      return;
    }

    try {
      this.isUploading.set(true);
      const { data: publicUrl, error } = await this.supabaseService.uploadAvatar(
        this.currentUser.id,
        file
      );

      this.ngZone.run(() => {
        if (error) {
          console.error('Avatar upload failed:', error);
          this.toastService.show('Failed to upload photo: ' + (error.message || error), 'error');
        } else if (publicUrl) {
          this.uploadedAvatarUrl.set(publicUrl);
          this.toastService.show('Profile photo uploaded! Save changes to apply.', 'success');
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        console.error('Avatar upload exception:', e);
        this.toastService.show('Failed to upload photo: unexpected error.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isUploading.set(false);
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.toastService.show('Please enter a valid username.', 'error');
      return;
    }

    const { username } = this.profileForm.value;
    const avatarUrl = this.uploadedAvatarUrl();

    const { error } = await this.supabaseService.updateUserProfile(
      this.currentUser.id,
      {
        username,
        avatar_url: avatarUrl
      }
    );

    this.ngZone.run(() => {
      if (error) {
        console.error('Profile update failed:', error);
        this.toastService.show('Failed to update profile: ' + error.message, 'error');
      } else {
        this.workspaceService.currentUserProfile.set({
          ...this.workspaceService.currentUserProfile(),
          username: username,
          avatar_url: avatarUrl
        });
        
        this.toastService.show('Profile updated successfully!', 'success');
        this.profileUpdated.emit();
        this.close.emit();
      }
    });
  }
}

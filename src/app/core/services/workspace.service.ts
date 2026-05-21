import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private supabaseService = inject(SupabaseService);

  currentUser = signal<any>(null);
  currentUserProfile = signal<any>(null);
  organization = signal<any>(null);
  todos = signal<any[]>([]);
  memberProfiles = signal<any[]>([]);
  adminProfile = signal<any>(null);

  isDarkMode = signal<boolean>(true);
  isPasswordRecoveryMode = signal<boolean>(false);

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode.set(savedTheme !== 'light');
  }

  toggleTheme() {
    const nextVal = !this.isDarkMode();
    this.isDarkMode.set(nextVal);
    localStorage.setItem('theme', nextVal ? 'dark' : 'light');
  }

  async loadProfileAndWorkspace() {
    const user = this.currentUser();
    if (!user) return;

    try {
      // 1. Fetch user profile from database
      const { data: dbProfile } = await this.supabaseService.getUserProfile(user.id);
      let profile = dbProfile;

      // 2. Self-healing: If profile doesn't exist in the database, provision it!
      if (!profile) {
        const role = user.user_metadata?.['role'] || 'user';
        let orgId = user.user_metadata?.['org_id'] || null;

        if (role === 'admin' && !orgId) {
          const orgName = user.user_metadata?.['org_name'] || 'My Workspace';
          // Create the organization in the DB
          const { data: newOrg } = await this.supabaseService.createOrganization(orgName);
          if (newOrg) {
            orgId = newOrg.id;
            // Save organization ID back to Auth User Metadata
            await this.supabaseService.updateAuthUserMetadata({ org_id: orgId });
          }
        }

        // Upsert profile in DB
        const profileData = {
          id: user.id,
          email: user.email,
          role: role,
          organization_id: orgId,
          username: user.user_metadata?.['username'] || user.email.split('@')[0],
          avatar_url: user.user_metadata?.['avatar_url'] || null
        };

        const { data: upsertedProfile } = await this.supabaseService.upsertUserProfile(profileData);
        profile = upsertedProfile || profileData;
      }

      // Set current user profile signal
      this.currentUserProfile.set(profile);

      // 3. Load organization & workspace details if organization_id is set
      if (profile.organization_id) {
        const { data: orgData } = await this.supabaseService.getOrganization(profile.organization_id);
        if (orgData) {
          this.organization.set(orgData);
        }

        // Load all profiles in the same organization
        const { data: profilesData } = await this.supabaseService.getProfiles(profile.organization_id);
        if (profilesData) {
          // Members list (exclude admin role)
          const membersOnly = profilesData.filter(p => p.role !== 'admin');
          this.memberProfiles.set(membersOnly);

          // Find organization admin profile
          const admin = profilesData.find(p => p.role === 'admin');
          this.adminProfile.set(admin || null);
        }
      }

      // Load tasks
      await this.loadTodos();
    } catch (err) {
      console.error('Error in loadProfileAndWorkspace:', err);
    }
  }

  async loadTodos() {
    const { data: todosData } = await this.supabaseService.getTodos();
    if (todosData) {
      this.todos.set(todosData);
    }
  }

  clear() {
    this.currentUser.set(null);
    this.currentUserProfile.set(null);
    this.organization.set(null);
    this.todos.set([]);
    this.memberProfiles.set([]);
    this.adminProfile.set(null);
  }
}

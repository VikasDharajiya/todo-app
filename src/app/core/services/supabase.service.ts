import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root', // This tells Angular "make one copy of this service available everywhere"
})
export class SupabaseService {
  // We create a private variable to hold our database connection
  private supabase: SupabaseClient;

  constructor() {
    // When the service starts, we connect to Supabase using our environment keys
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // 1. Sign Up a new user with optional role and organization details
  async signUp(email: string, password: string, role: string = 'user', orgName?: string, orgId?: string) {
    const response = await this.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: role,
          org_name: orgName,
          org_id: orgId,
        },
        emailRedirectTo: window.location.origin + '/auth',
      },
    });
    return response;
  }

  // 2. Log in an existing user
  async signIn(email: string, password: string) {
    const response = await this.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    return response;
  }

  // 3. Log out
  async signOut() {
    await this.supabase.auth.signOut();
  }

  // 3.5. Send password reset email
  async resetPassword(email: string) {
    const response = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth',
    });
    return response;
  }

  // 3.6. Update password for logged-in user (such as recovery flow)
  async updatePassword(password: string) {
    const response = await this.supabase.auth.updateUser({
      password: password,
    });
    return response;
  }

  // 4. Get the currently logged-in user
  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  // Expose onAuthStateChange for reactive session tracking
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // 5. Retrieve user profile (role, email, organization_id) from profiles table
  async getUserProfile(userId: string) {
    const response = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return response;
  }

  // 6. Retrieve organization details
  async getOrganization(orgId: string) {
    const response = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    return response;
  }

  // 7. Retrieve all user profiles in the same organization
  async getProfiles(orgId?: string) {
    let query = this.supabase.from('profiles').select('*');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const response = await query.order('email', { ascending: true });
    return response;
  }

  // 8. Retrieve todos (tasks) in the user's organization
  async getTodos() {
    const response = await this.supabase
      .from('todos')
      .select(`
        *,
        profiles:user_id (id, email, role),
        todo_participators (
          user_id,
          profiles:user_id (id, email)
        )
      `)
      .order('created_at', { ascending: false });

    return response;
  }

  // 9. Add a todo (task) assigned to a user in an organization with priority and participators
  async addTodo(
    taskText: string,
    userId: string,
    organizationId: string,
    assignedBy: string,
    priority: string = 'medium',
    participatorIds: string[] = [],
    dueDate: string | null = null,
    description: string | null = null
  ) {
    const { data, error } = await this.supabase
      .from('todos')
      .insert([
        {
          task: taskText,
          status: 'not_started',
          user_id: userId,
          organization_id: organizationId,
          assigned_by: assignedBy,
          priority: priority,
          due_date: dueDate || null,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (data && participatorIds.length > 0) {
      const participatorRows = participatorIds.map((pid) => ({
        todo_id: data.id,
        user_id: pid,
      }));

      const { error: participatorsError } = await this.supabase
        .from('todo_participators')
        .insert(participatorRows);

      if (participatorsError) {
        console.error('Failed to add participators:', participatorsError);
        return { data, error: participatorsError };
      }
    }

    return { data, error: null };
  }

  // 10. Update todo workflow status ('not_started', 'in_progress', 'completed')
  async updateTodoStatus(id: number, status: string) {
    const response = await this.supabase
      .from('todos')
      .update({ status: status })
      .eq('id', id);

    return response;
  }

  // 11. Delete a todo
  async deleteTodo(id: number) {
    const response = await this.supabase.from('todos').delete().eq('id', id);

    return response;
  }

  // 12. Subscribe to realtime changes on todos and todo_participators
  subscribeToTodos(callback: () => void) {
    return this.supabase
      .channel('todos-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        callback();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_participators' }, () => {
        callback();
      })
      .subscribe();
  }

  // 13. Update profile information (username and/or avatar_url)
  async updateUserProfile(userId: string, updates: { username?: string | null; avatar_url?: string | null }) {
    const response = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return response;
  }

  // 14. Upload avatar image file to Supabase storage bucket 'avatars'
  async uploadAvatar(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'avatars' bucket
      const { data, error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
      return { data: publicUrlData?.publicUrl || null, error: null };
    } catch (err: any) {
      console.error('Exception in uploadAvatar:', err);
      return { data: null, error: err };
    }
  }

  // Create an organization in the database
  async createOrganization(name: string) {
    const response = await this.supabase
      .from('organizations')
      .insert([{ name: name }])
      .select()
      .single();
    return response;
  }

  // Create or update a profile in the database
  async upsertUserProfile(profile: { id: string; email: string; role: string; organization_id: string | null; username?: string | null; avatar_url?: string | null }) {
    const response = await this.supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    return response;
  }

  // Update Supabase auth user metadata so that the session metadata reflects the organization and role
  async updateAuthUserMetadata(metadata: { role?: string; org_name?: string; org_id?: string }) {
    const response = await this.supabase.auth.updateUser({
      data: metadata
    });
    return response;
  }
}

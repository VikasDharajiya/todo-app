export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  organization_id: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface TodoParticipator {
  todo_id: number;
  user_id: string;
  profiles?: Profile;
}

export interface Todo {
  id: number;
  task: string;
  status: 'not_started' | 'in_progress' | 'completed';
  user_id: string;
  organization_id: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
  profiles?: Profile;
  todo_participators?: TodoParticipator[];
}

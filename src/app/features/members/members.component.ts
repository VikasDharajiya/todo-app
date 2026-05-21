import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MemberDetailComponent],
  templateUrl: './members.component.html',
})
export class MembersComponent {
  workspaceService = inject(WorkspaceService);

  memberProfiles = this.workspaceService.memberProfiles;
  adminProfile = this.workspaceService.adminProfile;

  // Selected member for detail view modal
  selectedMember = signal<any>(null);

  // Computes tasks that this member is part of (as Lead or Collaborator) OR delegated (if admin)
  selectedMemberTasks = computed(() => {
    const m = this.selectedMember();
    if (!m) return [];
    const allTodos = this.workspaceService.todos() || [];
    if (m.role === 'admin') {
      return allTodos.filter((t: any) => t.assigned_by === m.id);
    }
    return allTodos.filter(
      (t: any) =>
        t.user_id === m.id ||
        (t.todo_participators &&
          t.todo_participators.some((p: any) => p.user_id === m.id))
    );
  });

  // Computes completion stats for the selected member
  selectedMemberStats = computed(() => {
    const tasks = this.selectedMemberTasks();
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
    const pending = tasks.filter((t: any) => t.status === 'not_started').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, rate };
  });

  selectMember(member: any) {
    this.selectedMember.set(member);
  }

  closeDetails() {
    this.selectedMember.set(null);
  }

  trackByFn(index: number, item: any) {
    return item?.id || index;
  }
}

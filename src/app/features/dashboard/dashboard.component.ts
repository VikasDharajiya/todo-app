import { Component, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { TaskCreatorComponent } from './components/task-creator/task-creator.component';
import { TaskStatsComponent } from './components/task-stats/task-stats.component';
import { TaskLaneComponent } from './components/task-lane/task-lane.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TaskCreatorComponent, TaskStatsComponent, TaskLaneComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  supabaseService = inject(SupabaseService);
  workspaceService = inject(WorkspaceService);
  toastService = inject(ToastService);
  ngZone = inject(NgZone);

  // Track task creation modal dialog visibility
  showCreateModal = signal<boolean>(false);

  // Read signals from workspace state
  todos = this.workspaceService.todos;
  memberProfiles = this.workspaceService.memberProfiles;
  organization = this.workspaceService.organization;
  currentUserProfile = this.workspaceService.currentUserProfile;

  // Reactively calculate Kanban lanes
  todoLane = computed(() => this.todos().filter((t) => t.status === 'not_started'));
  inProgressLane = computed(() => this.todos().filter((t) => t.status === 'in_progress'));
  completedLane = computed(() => this.todos().filter((t) => t.status === 'completed'));

  // Reactively calculate Stats metrics
  totalTasks = computed(() => this.todos().length);
  completedTasks = computed(() => this.todos().filter((t) => t.status === 'completed').length);
  completionRate = computed(() => {
    const total = this.totalTasks();
    const completed = this.completedTasks();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  async handleUpdateStatus(todoId: number, newStatus: string) {
    const { error } = await this.supabaseService.updateTodoStatus(todoId, newStatus);

    this.ngZone.run(async () => {
      if (error) {
        console.error(error);
        this.toastService.show('Failed to update task status.', 'error');
      } else {
        this.toastService.show('Task status updated!', 'success');
        await this.workspaceService.loadTodos();
      }
    });
  }

  async handleDeleteTodo(todoId: number) {
    const { error } = await this.supabaseService.deleteTodo(todoId);

    this.ngZone.run(async () => {
      if (error) {
        console.error(error);
        this.toastService.show('Failed to delete task.', 'error');
      } else {
        this.toastService.show('Task deleted.', 'success');
        await this.workspaceService.loadTodos();
      }
    });
  }
}

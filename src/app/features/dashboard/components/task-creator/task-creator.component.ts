import { Component, Input, Output, EventEmitter, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { WorkspaceService } from '../../../../core/services/workspace.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-task-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SpinnerComponent],
  templateUrl: './task-creator.component.html',
})
export class TaskCreatorComponent {
  @Input() organization: any = null;
  @Input() memberProfiles: any[] = [];

  @Output() taskCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  supabaseService = inject(SupabaseService);
  workspaceService = inject(WorkspaceService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);

  taskForm: FormGroup;
  selectedParticipatorIds = signal<string[]>([]);
  taskError = signal<string>('');
  minDate: string = new Date().toISOString().split('T')[0];
  isLoading = signal<boolean>(false);

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      priority: ['medium', [Validators.required]],
      assigneeId: ['', [Validators.required]],
      dueDate: ['', [this.futureDateValidator()]],
      description: [''],
    });
  }

  futureDateValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(control.value);
      selected.setHours(0, 0, 0, 0);
      return selected >= today ? null : { pastDate: true };
    };
  }

  setPriority(level: 'low' | 'medium' | 'high') {
    this.taskForm.patchValue({ priority: level });
  }

  toggleParticipator(userId: string) {
    const current = this.selectedParticipatorIds();
    if (current.includes(userId)) {
      this.selectedParticipatorIds.set(current.filter((id) => id !== userId));
    } else {
      this.selectedParticipatorIds.set([...current, userId]);
    }
  }

  async handleAddTask() {
    if (this.taskForm.invalid) {
      this.taskError.set('Please fix form validation errors.');
      this.toastService.show('Please fix form validation errors.', 'error');
      return;
    }

    const { title, priority, assigneeId, dueDate, description } = this.taskForm.value;
    const participatorIds = this.selectedParticipatorIds();
    const currentUser = this.workspaceService.currentUser();

    if (!currentUser) {
      this.toastService.show('Session expired. Please log in again.', 'error');
      return;
    }

    try {
      this.isLoading.set(true);
      this.taskError.set('');

      const { error } = await this.supabaseService.addTodo(
        title,
        assigneeId,
        this.organization.id,
        currentUser.id,
        priority,
        participatorIds,
        dueDate || null,
        description || null
      );

      this.ngZone.run(() => {
        if (error) {
          console.error(error);
          this.taskError.set(error.message);
          this.toastService.show('Failed to create task: ' + error.message, 'error');
        } else {
          this.toastService.show('Task created and assigned successfully!', 'success');
          this.taskForm.reset({ priority: 'medium', title: '', assigneeId: '', dueDate: '', description: '' });
          this.selectedParticipatorIds.set([]);
          this.taskCreated.emit();
          this.close.emit();
        }
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.taskError.set('An unexpected error occurred.');
        this.toastService.show('Failed to create task.', 'error');
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './member-detail.component.html',
})
export class MemberDetailComponent {
  @Input() member: any = null;
  @Input() tasks: any[] = [];
  @Input() stats: any = null;

  @Output() close = new EventEmitter<void>();

  isOverdue(dueDateStr: string | null, status: string): boolean {
    if (!dueDateStr || status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  isDueToday(dueDateStr: string | null, status: string): boolean {
    if (!dueDateStr || status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }

  getDueDateClass(dueDateStr: string | null, status: string): string {
    if (!dueDateStr) return '';
    if (status === 'completed') {
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20';
    }
    if (this.isOverdue(dueDateStr, status)) {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20';
    }
    if (this.isDueToday(dueDateStr, status)) {
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20';
    }
    return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800';
  }

  trackByFn(index: number, item: any) {
    return item?.id || index;
  }
}

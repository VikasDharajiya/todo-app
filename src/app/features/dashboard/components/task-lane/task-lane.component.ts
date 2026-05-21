import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-lane',
  standalone: true,
  imports: [CommonModule, TaskCardComponent],
  templateUrl: './task-lane.component.html',
})
export class TaskLaneComponent {
  @Input() title: string = '';
  @Input() tasks: any[] = [];
  @Input() badgeColorClass: string = 'bg-slate-400';
  @Input() countColorClass: string = 'text-slate-500 bg-slate-200/60';
  @Input() currentUserProfile: any;

  @Output() updateStatus = new EventEmitter<{ todoId: number; status: string }>();
  @Output() deleteTodo = new EventEmitter<number>();

  trackByFn(index: number, item: any) {
    return item?.id || index;
  }
}

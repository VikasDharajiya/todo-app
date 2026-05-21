import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-stats.component.html',
})
export class TaskStatsComponent {
  @Input() completionRate: number = 0;
  @Input() completedTasks: number = 0;
  @Input() totalTasks: number = 0;
}

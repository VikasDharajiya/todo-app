import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: string = 'text-indigo-600 dark:text-indigo-400';

  get sizeClass(): string {
    if (this.size === 'sm') return 'h-4 w-4 border-2';
    if (this.size === 'lg') return 'h-8 w-8 border-3';
    return 'h-5 w-5 border-2.5';
  }
}

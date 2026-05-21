import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() maxWidthClass: string = 'max-w-lg';

  @Output() close = new EventEmitter<void>();
}

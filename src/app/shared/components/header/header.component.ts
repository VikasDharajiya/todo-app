import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  router = inject(Router);
  toastService = inject(ToastService);

  @Input() organization: any = null;
  @Input() isDarkMode: boolean = true;

  @Output() toggleTheme = new EventEmitter<void>();
  @Output() toggleMobileMenu = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  copyJoinCode(code: string) {
    navigator.clipboard.writeText(code);
    this.toastService.show('Join Code copied to clipboard! Share it with your team.', 'success');
  }
}

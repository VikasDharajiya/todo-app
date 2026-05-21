import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Date.now();
    this.toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      this.remove(id);
    }, 3500);
  }

  remove(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

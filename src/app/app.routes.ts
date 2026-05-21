import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'board',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent),
      },
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full',
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'board',
  }
];

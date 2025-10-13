import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((c) => c.Home),
  },
  {
    path: 'easy',
    loadComponent: () => import('./pages/levels/easy/easy').then((c) => c.Easy),
  },
  {
    path: 'medium',
    loadComponent: () => import('./pages/levels/medium/medium').then((c) => c.Medium),
  },
  {
    path: 'hard',
    loadComponent: () => import('./pages/levels/hard/hard').then((c) => c.Hard),
  },
  {
    path: '**',
    redirectTo: '',
  }
];

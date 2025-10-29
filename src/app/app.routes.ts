import { Routes } from '@angular/router';
import { publicGuard as publicGuard } from './guards/public.guard';

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
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((c) => c.Login),
    canActivate: [publicGuard],
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then((c) => c.Signup),
    canActivate: [publicGuard],
  },
  {
    path: '**',
    redirectTo: '',
  }
];

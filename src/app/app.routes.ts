import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'easy',
    loadComponent: () => import('./pages/levels/easy/easy.component').then((c) => c.EasyComponent),
  },
  {
    path: 'medium',
    loadComponent: () => import('./pages/levels/medium/medium.component').then((c) => c.MediumComponent),
  },
  {
    path: 'hard',
    loadComponent: () => import('./pages/levels/hard/hard.component').then((c) => c.HardComponent),
  }
];

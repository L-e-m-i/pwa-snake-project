import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
    const router = inject(Router);
    if (authService.user()) {

        router.navigate(['/']);
        return false;
    }

    return true;
};

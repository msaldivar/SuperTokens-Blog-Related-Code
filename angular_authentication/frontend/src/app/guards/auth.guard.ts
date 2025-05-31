import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
const authService = inject(AuthService);
const router = inject(Router);

if (authService.isLoggedIn()) {
    // User is logged in, allow access
    return true;
}

// Not logged in, redirect to login page with return URL
router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
return false;
};
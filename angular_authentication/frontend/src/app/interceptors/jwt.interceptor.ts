import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
const authService = inject(AuthService);

// Get the current user from the auth service
const currentUser = authService.currentUserValue;

// If using sessionStorage and we have a token, add it to the Authorization header
if (currentUser && currentUser.token) {
    request = request.clone({
    setHeaders: {
        Authorization: `Bearer ${currentUser.token}`
    }
    });
}

// If the endpoint requires credentials (for HttpOnly cookies), add withCredentials
if (request.url.includes('/api/')) {
    request = request.clone({
    withCredentials: true
    });
}

return next(request);
};
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
selector: 'app-logout',
template: `
    <button class="logout-btn" (click)="logout()">
    Logout
    </button>
`,
styles: [`
    .logout-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    font-size: 16px;
    padding: 5px 10px;
    }
    .logout-btn:hover {
    text-decoration: underline;
    }
`]
})
export class LogoutComponent {

constructor(
    private authService: AuthService,
    private router: Router
) {}

logout(): void {
    this.authService.logout().subscribe({
    next: () => {
        this.router.navigate(['/login']);
    },
    error: err => {
        console.error('Logout error:', err);
        // Even if the server request fails, we want to clear local state
        sessionStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
    }
    });
}
}
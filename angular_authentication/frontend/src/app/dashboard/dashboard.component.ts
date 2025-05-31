import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
selector: 'app-dashboard',
standalone: true,
imports: [CommonModule],
template: `
    <div class="dashboard">
    <h2>Welcome to your Dashboard</h2>
    <p>Hello, {{ currentUser?.username }}</p>
    
    <div class="auth-status" *ngIf="currentUser">
        <h3>Authentication Status</h3>
        <p><strong>Status:</strong> Authenticated</p>
        <p><strong>Auth Method:</strong> {{ hasToken ? 'JWT in sessionStorage' : 'HttpOnly Cookie' }}</p>
        
        <div class="api-test">
        <h3>API Test</h3>
        <button (click)="testApi('hello')" class="test-btn">Test Public API</button>
        <button (click)="testApi('protected')" class="test-btn">Test Protected API</button>
        
        <div *ngIf="apiResponse" class="response-box">
            <h4>API Response:</h4>
            <pre>{{ apiResponse | json }}</pre>
        </div>
        </div>
    </div>
    
    <div class="actions">
        <button class="logout-btn" (click)="logout()">Logout</button>
    </div>
    </div>
`,
styles: [`
    .dashboard {
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    }
    
    .auth-status {
    margin: 20px 0;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
    }
    
    .api-test {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    }
    
    .test-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    margin-right: 10px;
    border-radius: 4px;
    cursor: pointer;
    }
    
    .test-btn:hover {
    background-color: #0069d9;
    }
    
    .response-box {
    margin-top: 15px;
    padding: 15px;
    background-color: #f1f1f1;
    border-radius: 4px;
    overflow: auto;
    }
    
    pre {
    margin: 0;
    white-space: pre-wrap;
    }
    
    .actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: right;
    }
    
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
export class DashboardComponent implements OnInit {
currentUser: any;
hasToken: boolean = false;
apiResponse: any = null;

constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
) {}

ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
    console.log('Dashboard received user update:', user);
    this.currentUser = user;
    
    // Check if we're using token-based auth (sessionStorage)
    const storedUser = sessionStorage.getItem('currentUser');
    this.hasToken = storedUser ? true : false;
    });
}

testApi(endpoint: 'hello' | 'protected'): void {
    console.log(`Testing ${endpoint} API endpoint`);
    this.apiResponse = null; // Clear previous response
    
    this.http.get(`http://localhost:3000/api/${endpoint}`, {
    withCredentials: true // Important for cookies
    }).subscribe({
    next: (response) => {
        console.log(`${endpoint} API response:`, response);
        this.apiResponse = response;
    },
    error: (error) => {
        console.error(`${endpoint} API error:`, error);
        this.apiResponse = {
        error: true,
        message: error.error?.message || error.statusText || 'Unknown error',
        status: error.status
        };
    }
    });
}

logout(): void {
    console.log('Logout button clicked');
    
    this.authService.logout().subscribe({
    next: () => {
        console.log('Logout successful, redirecting to login page');
        this.router.navigate(['/login']);
    },
    error: err => {
        console.error('Logout error:', err);
        // Even if the server request fails, we want to clear local state
        sessionStorage.removeItem('currentUser');
        console.log('Session storage cleared, redirecting to login page');
        this.router.navigate(['/login']);
    }
    });
}
}
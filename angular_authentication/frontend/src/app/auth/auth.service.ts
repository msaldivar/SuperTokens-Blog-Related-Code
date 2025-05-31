import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class AuthService {
private apiUrl = 'http://localhost:3000/api';
private currentUserSubject = new BehaviorSubject<any>(null);
public currentUser$ = this.currentUserSubject.asObservable();

constructor(private http: HttpClient) {
    // Check sessionStorage for existing user on service init
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
    this.currentUserSubject.next(JSON.parse(storedUser));
    }
}

login(username: string, password: string): Observable<any> {
    console.log('Login attempt:', username);
    
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }, {
    withCredentials: true // Important for cookies
    }).pipe(
    tap(response => {
        console.log('Login response received:', response);
        
        // If using sessionStorage (Option 2)
        if (response.token) {
        const user = {
            ...response.user,
            token: response.token
        };
        
        // Store user details in sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('User stored in session storage');
        }
        // If using HttpOnly cookies (Option 1)
        else if (response.user) {
        this.currentUserSubject.next(response.user);
        }
    })
    );
}

logout(): Observable<any> {
    console.log('Logout service method called');
    
    return this.http.post<any>(`${this.apiUrl}/logout`, {}, {
    withCredentials: true // Important for cookies
    }).pipe(
    tap(() => {
        console.log('Logout response received, clearing session storage');
        // Clear sessionStorage
        sessionStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        console.log('Current user reset to null');
    })
    );
}

get currentUserValue() {
    return this.currentUserSubject.value;
}

isLoggedIn(): boolean {
    return !!this.currentUserValue;
}
}
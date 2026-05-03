import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
export interface User {
  id: number;
  name: string;
  email: string;
  national_id: string;
  phone?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  image?: string; 
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';
  private apiLogout = environment.apiUrl + '/Logout';
  private platformId = inject(PLATFORM_ID);

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }


  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  private handleAuthSuccess(data: { user: User; token: string }) {

    if (this.isBrowser()) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    this.currentUser.set(data.user);
    this.isAuthenticated.set(true);
  }

  private loadUserFromStorage() {
    if (this.isBrowser()) {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        } catch {
          this.logout();
        }
      }
    }
  }

logout(): void {

  this.http.post(`${this.apiLogout}/Logout`, {}).subscribe({
    next: () => {
      this.clearSession();
    },
    error: () => {
     
      this.clearSession();
    }
  });

}

private clearSession() {

  if (this.isBrowser()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  this.currentUser.set(null);
  this.isAuthenticated.set(false);
  this.router.navigate(['/login']);
}



  getUser() {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('token');
    }
    return null;
  }

  clearSessionOnly(): void {
  if (this.isBrowser()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  this.currentUser.set(null);
  this.isAuthenticated.set(false);
}
}
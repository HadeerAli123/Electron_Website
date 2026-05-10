import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  
  protected apiUrl = environment.apiUrl;
  
  constructor(
    protected http: HttpClient,
    protected ngZone: NgZone
  ) {}
  
  // GET method مع auto change detection
  protected get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`).pipe(
      tap(() => {
        this.ngZone.run(() => {
          // Force change detection
        });
      })
    );
  }
  
  // POST method
  protected post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data).pipe(
      tap(() => {
        this.ngZone.run(() => {
          // Force change detection
        });
      })
    );
  }
  
  // PUT method
  protected put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data).pipe(
      tap(() => {
        this.ngZone.run(() => {
          // Force change detection
        });
      })
    );
  }
  
  // DELETE method
  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`).pipe(
      tap(() => {
        this.ngZone.run(() => {
          // Force change detection
        });
      })
    );
  }
}
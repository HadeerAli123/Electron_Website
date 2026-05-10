import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';


interface ProfileResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    national_id: string;
    phone: string | null;
    role: string;
    created_at: string;
    updated_at: string;
    remember_token:string
  };
}


export interface BrokerStats {
  clients: number;
  balance: number;
  commissions: number;
  monthlySales: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  
  private apiUrl = environment.apiUrl;
  
  
  constructor(private http: HttpClient) {}
  
  getProfile(): Observable<ProfileResponse['data']> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching profile:', error);
        throw error;
      })
    );
  }
  

  getBrokerStats(): Observable<BrokerStats> {
   
    return of({
      clients: 127,
      balance: 3450,
      commissions: 12890,
      monthlySales: 45
    });
  }
updateProfile(data: { name: string; email: string; phone: string; national_id: string }): Observable<any> {
  const token = localStorage.getItem('token');
  return this.http.put(`${this.apiUrl}/update-profile`, data, { 
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).pipe(
    map((res: any) => res.data),
    catchError(error => {
      console.error('Error updating profile:', error);
      throw error;
    })
  );
}

} 
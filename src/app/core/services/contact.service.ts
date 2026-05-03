import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface ContactData {
  fname: string;
  lname: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    created_at: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  
  private apiUrl = environment.apiUrl;
  
  
  constructor(private http: HttpClient) {}
  
  sendMessage(data: ContactData): Observable<ContactResponse> {
    console.log(' Sending contact message:', data);
    
    return this.http.post<ContactResponse>(`${this.apiUrl}/contact`, data);
  }
}
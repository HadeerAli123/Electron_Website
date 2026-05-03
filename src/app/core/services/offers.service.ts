import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private http = inject(HttpClient);
  private api = environment.apiUrl + '/special-offers';
  

  getOffers() {
    return this.http.get<any>(this.api);
  }

  getOfferDetails(id: number) {
    return this.http.get<any>(`${this.api}/details/${id}`);
  }
}
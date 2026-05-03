import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface SearchResult {
  products: any[];
  marks: any[];
  classes: any[];
  popular_searches: string[];
  meta: {
    products_total: number;
    marks_total: number;
    classes_total: number;
  };
}

interface SearchApiResponse {
  success: boolean;
  query: string;
  data: {
    products: any[];
    marks: any[];
    classes: any[];
    popular_searches?: string[];
  };
  meta: {
    products_total: number;
    marks_total: number;
    classes_total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = environment.apiUrl + '/search';

  constructor(private http: HttpClient) {}

  search(query: string, limit: number = 10): Observable<SearchResult> {
    const formData = new FormData();
    formData.append('search', query);
    formData.append('limit', limit.toString());

    return this.http.post<SearchApiResponse>(this.apiUrl, formData).pipe(
      map(response => ({
        products: response.data?.products ?? [],
        marks: response.data?.marks ?? [],
        classes: response.data?.classes ?? [],
        popular_searches: response.data?.popular_searches ?? [],
        meta: response.meta ?? {
          products_total: 0,
          marks_total: 0,
          classes_total: 0,
        },
      }))
    );
  }
}
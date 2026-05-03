import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SiteSetting {
  id: number;
  name_ar: string;
  name_en: string;
  phone: string;
  whatsapp: string;
  email: string;
  url: string | null;
  address: string;
  decription: string;
  logo: string;
  maintenance_mode: boolean; 
  shipping_data: {
    currency: string;
    currency_symbol: string;
    tax_rate: string;
    min_order_amount: string;
    free_shipping_min: string;
    shipping_cost: string;
  };

  all_settings: {
    favicon: string;
    show_out_of_stock: boolean;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    products_per_page: number;
  };
}

@Injectable({ providedIn: 'root' })

export class SiteSettingService {
  private http = inject(HttpClient);

  private settingSubject = new BehaviorSubject<SiteSetting | null>(null);
  setting$ = this.settingSubject.asObservable();

  loadSettings() {
    return this.http.get<{ success: boolean; data: SiteSetting }>(
      `${environment.apiUrl}/site-setting`
    ).pipe(
      tap(res => {
        if (res.success) this.settingSubject.next(res.data);
      })
    );
  }

  get setting(): SiteSetting | null {
    return this.settingSubject.getValue();
  }
  getCurrencySymbol(): string {
  return this.setting?.shipping_data?.currency_symbol || 'د.ك';
}
}
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


export interface ClassCategory {
  id: number;
  name: string;
  status: string;
  image?: string | null;
}

export interface Mark {
  id: number;
  name: string;
  status: string;
  image?: string | null;
}

export interface ClassWithMarks {
  class: ClassCategory;
  marks: Mark[];
}

export interface InstallmentPlan {
  id: number;
  title: string;
  months: number;
  interest_rate: string;
  down_payment_percentage: string;
}

export interface ProductVariant {
  variant_id: number;
  stock: number;
  attributes: Record<string, { attribute_id: number; attribute_value_id: number; value: string }>;
}

export interface Product {
  id: number;
  name: string | null;
  model: string;
  sku?: string | null;
  description: string;
  short_description?: string | null;
  price: number | string;
  net_price: number | string;
  sale_price?: string | number | null;
  new_price?: number;
  discount?: number;
  class_id: string|number;
  mark_id: string | number;
  stock: number;
  min_stock?: number;
  cover_image: string | null;
  is_active?: number;
  is_featured?: number;
  is_new?: string ;
  is_new_product?: boolean;
  video?: string | null;
  sponsorship?: string;
  made_in?: string;
  number?: string;
  available_variants?: ProductVariant[];
}

export interface MarkWithProducts {
  mark: Mark;
  products: Product[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CategoryProduct {
  id: number;
  name: string | null;
  model: string;
  description: string;
  price: string;
  net_price: string;
  stock: number;
  cover_image: string | null;
  mark_name: string;
  class_name: string;
  company_name: string;
  images: { id: number; product_id: number; image_path: string }[];
  video: string | null;
  barcode?: string;
  offers: {
    id: number;
    offer_name: string;
    discount_percent: number;
    offer_code: string;
    expires_at: string;
    is_expired: boolean;
    pivot: {
      discounted_price: string;
    };
  }[];
    is_new?: boolean;
is_new_product?: boolean;
  installment_plans: InstallmentPlan[];
  currency: string;
}

export interface ProductDetail {
  id: number;
  name: string | null;
  model: string;
  description: string;
  price: string;
  net_price: string;
  stock: number;
  cover_image: string | null;
  mark_name: string;
  class_name: string;
  company_name: string;
  images: { id?: number; image_path?: string }[];
  video: string | null;
  barcode?: string;
  offers: any[];
  is_new: boolean;

  currency: string;
}

export interface ProductFullDetail {
  product: ProductDetail;
  variants: ProductVariant[];
  grouped_attributes: Record<string, {
    attribute_id: number;
    values: { attribute_value_id: number; value: string }[];
  }>;
}


interface TreeResponse {
  success: boolean;
  data: ClassCategory[];
}

interface ParentsResponse {
  success: boolean;
  data: ClassWithMarks[];
}

interface ParentsByIdResponse {
  success: boolean;
  marks: MarkWithProducts[];
}

interface ProductsByCategoryResponse {
  success?: boolean;
  data: CategoryProduct[];
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    product: ProductDetail;
    variants: ProductVariant[];
    grouped_attributes: Record<string, {
      attribute_id: number;
      values: { attribute_value_id: number; value: string }[];
    }>;
  };
}


@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  private wrapZone<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(tap(() => this.ngZone.run(() => {})));
  }

  getAllClasses(): Observable<ClassCategory[]> {
    return this.wrapZone(
      this.http.get<TreeResponse>(`${this.apiUrl}/categories/tree`).pipe(
        map((r) => r.data ?? []),
        catchError((err) => {
          console.error('[CategoriesService] Error fetching classes:', err);
          return of([]);
        }),
      ),
    );
  }

getClassesWithMarks(): Observable<ClassWithMarks[]> {
  return this.wrapZone(
    this.http.get<ParentsResponse>(`${this.apiUrl}/categories/parents`).pipe(
      map((r) => {
        const data = r.data ?? [];

        return data
          .filter(cls => cls.class.status === 'active')

          .map(cls => ({
            ...cls,
            marks: (cls.marks ?? []).filter(mark => mark.status === 'active')
          }));
      }),
      catchError((err) => {
        console.error('[CategoriesService] Error fetching classes with marks:', err);
        return of([]);
      }),
    ),
  );
}



getMarksByClass(classId: number): Observable<MarkWithProducts[]> {
  return this.wrapZone(
    this.http.get<ParentsByIdResponse>(`${this.apiUrl}/categories/parents/${classId}`).pipe(
      map((r) => {
        const marks = r.marks ?? [];

        return marks
          .filter(item => item.mark.status === 'active')

          .map(item => ({
            ...item,

            mark: {
              ...item.mark,
              image: this.fixImageUrl(item.mark.image)
            },

            products: (item.products ?? []).filter(p => p.is_active === 1)
          }));
      }),
      catchError((err) => {
        console.error(`[CategoriesService] Error fetching marks for class ${classId}:`, err);
        return of([]);
      }),
    ),
  );
}

  getProductsByMark(markId: number): Observable<CategoryProduct[]> {
    return this.wrapZone(
      this.http.get<ProductsByCategoryResponse>(`${this.apiUrl}/products/category/${markId}`).pipe(
        map((r) => r.data ?? []),
        catchError((err) => {
          console.error(`[CategoriesService] Error fetching products for mark ${markId}:`, err);
          return of([]);
        }),
      ),
    );
  }

  getProductById(id: number): Observable<ProductFullDetail | undefined> {
    return this.wrapZone(
      this.http.get<ProductDetailResponse>(`${this.apiUrl}/products/site/${id}`).pipe(
        map((r) => r.data as ProductFullDetail),
        catchError((err) => {
          console.error(`[CategoriesService] Error fetching product ${id}:`, err);
          return of(undefined);
        }),
      ),
    );
  }


  getProductDisplayName(product: Product | ProductDetail | CategoryProduct): string {
    return product.name?.trim() || (product as any).model || 'منتج بدون اسم';
  }
getDisplayPrice(product: Product | ProductDetail | CategoryProduct): number {
  const parsePrice = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    const cleaned = String(val).replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const netPrice = parsePrice((product as any).net_price);
  const price = parsePrice(product.price);
  return netPrice > 0 ? netPrice : price;
}

formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/,/g, '')) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

  getDiscountedPrice(product: CategoryProduct): number | null {
    if (!product.offers?.length) return null;
    const offer = product.offers[0];
    if (offer.is_expired) return null;
    const discounted = +offer.pivot?.discounted_price;
    return discounted > 0 ? discounted : null;
  }

  fixImageUrl(image: string | null | undefined): string | null {
    if (!image) return null;
    if (image.startsWith('http')) return image;   
    const baseUrl = this.apiUrl.replace('/api', ''); 
    return `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  }
}
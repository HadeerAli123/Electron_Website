import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, forkJoin } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { Product } from './categories.service';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

export interface GuestCartItem {
  product_id: number;
  quantity: number;
  product: Product;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: number;
  offer_code?: string;
  created_at?: string;
  updated_at?: string;
  product: Product;
  paymentMethod?: 'cash' | 'installment';
  installmentMonths?: number;
  final_price?: number;
  cover_image?: string;
}

export interface CartSummary {
  id: number;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  cart_items: CartItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface InstallmentPlan {
  id: number;
  name: string;
  description?: string;
  duration_months: number;
  interest_rate: number;
  down_payment: number;
  monthly_payment: number;
  total_amount: number;
  admin_fee: number;
  total_interest: number;
}

export interface BackendCartProduct {
  id: number;
  name: string;
  sku: string;
  original_price: number;
  final_price: number;
  discount_applied: boolean;
  offer_code: string | null;
  discount_percent: number;
  discount_amount: number;
}

export interface BackendCartData {
  products: BackendCartProduct[];
  products_count: number;
  subtotal: number;
  total_discount: number;
  total: number;
}

export interface CartInstallmentRequest {
  products: { product_id: number; offer_code?: string }[];
}

export interface CartInstallmentResponse {
  success: boolean;
  message: string;
  data: {
    cart: BackendCartData;
    installment_plans: InstallmentPlan[];
    plans_count: number;
  };
}

export interface CashOrderForm {
  shipping_name: string;
  shipping_phone: string;
  shipping_city: string;
  shipping_area: string;
  shipping_block: string;
  shipping_street: string;
  shipping_building: string;
  shipping_floor?: string;
  shipping_apartment?: string;
  shipping_notes?: string;
  notes?: string;
  full_address?: string;
}

export interface InstallmentOrderForm {
  phone: string;
  monthly_salary: number;
  ministry_id: number;
  full_name?: string;
  civil_id?: string;
  work_phone?: string;
  notes?: string;
}

export interface CheckoutRequest {
  payment_type: 'cash' | 'installment';
  installment_plan_id?: number;
  items?: { cart_item_id?: number; product_id?: number; quantity: number }[];
  total_amount: number;
  offer_code?: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_city?: string;
  full_address?: string;
  shipping_area?: string;
  shipping_block?: string;
  shipping_street?: string;
  shipping_building?: string;
  shipping_floor?: string;
  shipping_apartment?: string;
  shipping_notes?: string;
  phone?: string;
  monthly_salary?: number;
  ministry_id?: number;
  full_name?: string;
  civil_id?: string;
  work_phone?: string;
  notes?: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: {
    id: number;
    order_number: string;
    payment_type: string;
    installment_plan_id?: number;
    total_price: string;
    total_amount: number;
    status: string;
    user_id: number;
    created_at?: string;
    updated_at?: string;
  };
}

export interface InstallmentRequest {
  order_id: number;
  monthly_salary: number;
}

export interface Ministry {
  id: number;
  name_ar: string;
}

export interface VerifyOfferResponse {
  success: boolean;
  message: string;
  data: {
    offer: {
      id: number;
      offer_name: string;
      description: string;
      banner_image: string;
      discount_percent: number;
      offer_code: string;
      expires_at: string;
      expires_at_human: string;
      days_left: number;
      is_featured: boolean;
      products: {
        id: number;
        name: string;
        sku: string;
        cover_image: string;
        original_price: number;
        discounted_price: number;
        savings: number;
        discount_percent: number;
      }[];
      products_count: number;
      total_savings: number;
    };
  } | null;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly GUEST_CART_KEY = 'guest_cart';

  private readonly cartSubject = new BehaviorSubject<CartSummary | null>(null);
  readonly cart$ = this.cartSubject.asObservable();

  private readonly guestCountSubject = new BehaviorSubject<number>(
    this._calcGuestCount()
  );
  readonly guestCount$ = this.guestCountSubject.asObservable();

  private readonly installmentPlansSubject = new BehaviorSubject<InstallmentPlan[]>([]);
  readonly installmentPlans$ = this.installmentPlansSubject.asObservable();

  readonly itemCount$ = this.cart$.pipe(
    map(cart => {
      if (cart) {
        return cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      }
      return this.guestCountSubject.getValue();
    })
  );

  readonly totalPrice$ = this.cart$.pipe(
    map(cart =>
      cart?.cart_items?.reduce((sum, item) => {
        const unitPrice = item.final_price
          ?? (item.product.sale_price ? +item.product.sale_price : +item.product.price);
        return sum + unitPrice * item.quantity;
      }, 0) ?? 0
    )
  );

  // ── Helper: headers مع Auth token ─────────────────────────────────────────
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ── Helper: headers بدون Auth ──────────────────────────────────────────────
  private getPublicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  }

  private _calcGuestCount(): number {
    try {
      const raw = localStorage.getItem('guest_cart');
      const items: GuestCartItem[] = raw ? JSON.parse(raw) : [];
      return items.reduce((sum, item) => sum + item.quantity, 0);
    } catch {
      return 0;
    }
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // ─── Guest Cart ───────────────────────────────────────────────────────────
  getGuestCart(): GuestCartItem[] {
    try {
      const raw = localStorage.getItem(this.GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveGuestCart(items: GuestCartItem[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(items));
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    this.guestCountSubject.next(total);
  }

  clearGuestCart(): void {
    localStorage.removeItem(this.GUEST_CART_KEY);
    this.guestCountSubject.next(0);
  }

  addToGuestCart(product: Product, quantity: number): void {
    const items = this.getGuestCart();

    const existing = items.find(i => i.product_id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        product_id: product.id,
        quantity,
        product,
      });
    }

    this.saveGuestCart(items);
  }

  mergeGuestCartAfterLogin(): Observable<any> {
    const guestItems = this.getGuestCart();
    if (!guestItems.length) return of(null);

    const requests = guestItems.map(item =>
      this.http.post<ApiResponse<any>>(
        `${this.baseUrl}/cart/add`,
        { product_id: item.product_id, quantity: item.quantity },
        { headers: this.getAuthHeaders() }
      ).pipe(catchError(() => of(null)))
    );

    return forkJoin(requests).pipe(
      tap(() => {
        this.clearGuestCart();
        this.getUserCart().subscribe();
      })
    );
  }

  // ─── Installment Plans (public) ───────────────────────────────────────────
  getCartInstallmentPlans(
    products: { product_id: number; offer_code?: string }[]
  ) {
    return this.http.post<CartInstallmentResponse>(
      `${this.baseUrl}/cart/installment-plans`,
      { products },
      { headers: this.getPublicHeaders() }
    );
  }

  // ─── Ministries (public) ──────────────────────────────────────────────────
  getMinistries(): Observable<Ministry[]> {
    return this.http
      .get<{ success: boolean; data: Ministry[] }>(
        `${this.baseUrl}/ministries`,
        { headers: this.getPublicHeaders() }
      )
      .pipe(
        map(res => res.data),
        catchError(() => of([]))
      );
  }

  // ─── Cart (auth required) ─────────────────────────────────────────────────
  getUserCart(): Observable<CartSummary> {
    return this.http
      .get<ApiResponse<CartSummary>>(
        `${this.baseUrl}/cart/user-cart`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(res => res.data),
        tap(cart => this.cartSubject.next(cart)),
        catchError(err => {
          this.cartSubject.next(null);
          return throwError(() => err);
        })
      );
  }

  updateQuantityLocally(itemId: number, delta: number): { success: boolean; reason?: string } {
    const cart = this.cartSubject.getValue();
    if (!cart) return { success: false, reason: 'no_cart' };
    const items = cart.cart_items.map(item => {
      if (item.id !== itemId) return item;
      const newQty = item.quantity + delta;
      if (newQty < 1) return item;
      return { ...item, quantity: newQty };
    });
    this.cartSubject.next({ ...cart, cart_items: items });
    return { success: true };
  }

  // دايمًا true — الاستوك دايمًا متوفر
  canIncrease(item: CartItem): boolean {
    return true;
  }

  canDecrease(item: CartItem): boolean {
    return item.quantity > 1;
  }
  addToCart(
    productId: number,
    quantity: number = 1,
    product?: Product
  ): Observable<CartSummary | null> {

    if (!this.isLoggedIn()) {
      if (product) this.addToGuestCart(product, quantity);
      return of(null);
    }

    return this.http
      .post<ApiResponse<any>>(
        `${this.baseUrl}/cart/add`,
        { product_id: productId, quantity },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        switchMap(() => this.getUserCart()),
        catchError(err => throwError(() => err))
      );
  }
  removeCartItem(id: number): Observable<CartSummary> {
    return this.http
      .delete<ApiResponse<any>>(
        `${this.baseUrl}/cart/remove/${id}`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(switchMap(() => this.getUserCart()));
  }

  checkout(checkoutData: CheckoutRequest): Observable<OrderResponse> {
    const url = this.isLoggedIn()
      ? `${this.baseUrl}/orders/create`
      : `${this.baseUrl}/orders/guest-create`;

    const headers = this.isLoggedIn()
      ? this.getAuthHeaders()
      : this.getPublicHeaders();

    return this.http
      .post<OrderResponse>(url, checkoutData, { headers })
      .pipe(catchError(err => throwError(() => err)));
  }

  submitInstallmentRequest(data: InstallmentRequest): Observable<any> {
    return this.http
      .post<any>(
        `${this.baseUrl}/installments/requests`,
        data,
        { headers: this.getAuthHeaders() }
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  clearCart(): void {
    this.cartSubject.next(null);
  }

  // ─── Special Offers ───────────────────────────────────────────────────────
  verifyOfferCode(offerCode: string): Observable<VerifyOfferResponse> {
    return this.http.post<VerifyOfferResponse>(
      `${this.baseUrl}/special-offers/verify`,
      { offer_code: offerCode },
      { headers: this.getAuthHeaders() }
    );
  }
}
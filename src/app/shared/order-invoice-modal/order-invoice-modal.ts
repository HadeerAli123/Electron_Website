import {
  Component,
  signal,
  input,
  output,
  computed,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


export interface OrderProduct {
  id: number;
  name: string;
  sku?: string;
  cover_image?: string;
  price?: string;
  is_new_product?: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string;
  created_at?: string;
  updated_at?: string;
  product?: OrderProduct;
}

export interface OrderUser {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface InstallmentPlan {
  id?: number;
  name?: string;
  duration_months?: number;
  monthly_amount?: number;
  interest_rate?: number;
  admin_fee?: number;
  down_payment?: number;
  monthly_payment?: number; // ← أضيفي ده
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: string;
  tax_amount: string;
  shipping_cost: string;
  grand_total: string;
  status: string;
  order_number: string;
  total_price?: string;
  payment_type: 'cash' | 'installment' | string;
  created_at: string;
  updated_at?: string;
  installment_plan_id?: number | null;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_area?: string | null;
  shipping_block?: string | null;
  shipping_street?: string | null;
  shipping_building?: string | null;
  shipping_floor?: string | null;
  shipping_apartment?: string | null;
  shipping_notes?: string | null;
  full_address?: string;
  notes?: string | null;
  admin_notes?: string | null;
  civil_id?: string | null;
  monthly_salary?: number | null;
  ministry_id?: number | null;
  work_phone?: string | null;
  installment_status?: string | null;
  order_item: OrderItem[];
  user: OrderUser;
  installment_plan?: InstallmentPlan | null;
}

export interface Setting {
  id?: number;
  name_ar?: string;
  name_en?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  favicon?: string;
}

export interface ShippingData {
  shipping_cost?: string;
  tax_rate?: string;
  currency_symbol?: string;
}

export interface OrderInvoiceResponse {
  order: Order;
  setting: Setting;
  shipping: ShippingData;
}


@Component({
  selector: 'app-order-invoice-modal',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './order-invoice-modal.html',
  styleUrl: './order-invoice-modal.css',
})
export class OrderInvoiceModal {
  @ViewChild('invoiceWrapper') invoiceWrapper!: ElementRef;

  private http = inject(HttpClient);

  readonly isVisible = signal(false);
  readonly order = signal<OrderInvoiceResponse | null>(null);
  readonly loading = signal(false);

  readonly closed = output<void>();

  readonly currency = computed(
    () => this.order()?.shipping?.currency_symbol || 'د.ك'
  );


open(orderId: number): void {
  this.isVisible.set(true);
  this.loading.set(true);
  document.body.style.overflow = 'hidden';

  const url = `${environment.apiUrl}/orders/${orderId}/print`;

  this.http.get<OrderInvoiceResponse>(url).subscribe({
    next: (res) => {
      this.order.set(res);
      this.loading.set(false);
    },
    error: (err) => {
      console.error('Failed to load invoice:', err);
      this.loading.set(false);
    },
  });
}

 
  openWithData(data: OrderInvoiceResponse): void {
    this.order.set(data);
    this.isVisible.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isVisible.set(false);
    document.body.style.overflow = '';
    this.closed.emit();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('invoice-overlay')) {
      this.close();
    }
  }

  printInvoice(): void {
    window.print();
  }


  toNumber(value: string | number | undefined | null): number {
    if (!value) return 0;
    return parseFloat(String(value)) || 0;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-KW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      pending: '⏳ في الانتظار',
      confirmed: '✅ تم التأكيد',
      processing: '⚙️ قيد المعالجة',
      shipped: '🚚 تم الشحن',
      delivered: '📦 تم التوصيل',
      cancelled: '❌ ملغي',
    };
    return map[status ?? ''] ?? status ?? '';
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return map[status ?? ''] ?? 'status-pending';
  }

  getPaymentLabel(type?: string): string {
    const map: Record<string, string> = {
      cash: '💵 دفع كاش',
      installment: '💳 تقسيط',
    
    };
    return map[type ?? ''] ?? type ?? '';
  }
}
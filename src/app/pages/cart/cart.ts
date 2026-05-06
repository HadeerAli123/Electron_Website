import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { SiteSettingService } from '../../core/services/site-setting.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Ministry } from '../../core/services/cart.service';
import { BackButton } from '../../shared/components/back-button/back-button';
import { PriceFormatPipe } from '../../shared/components/pipes/price-format.pipe';

import {
  CartService,
  CartItem,
  CartSummary,
  BackendCartData,
  BackendCartProduct,
  CheckoutRequest,
  InstallmentPlan,
  InstallmentRequest,
  CashOrderForm,
  InstallmentOrderForm,
  VerifyOfferResponse,
} from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BackButton, PriceFormatPipe],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class CartComponent implements OnInit, OnDestroy {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private readonly toastr = inject(ToastrService);
  private siteSettingService = inject(SiteSettingService);

  setting = computed(() => this.siteSettingService.setting);

  // ───────────────── MINISTRIES ─────────────────
  readonly ministries = signal<Ministry[]>([]);
  readonly ministryDropdownOpen = signal(false);
  readonly ministrySearch = signal('');
  readonly filteredMinistries = computed(() => {
    const search = this.ministrySearch().toLowerCase();
    if (!search) return this.ministries();
    return this.ministries().filter((m) => m.name_ar.toLowerCase().includes(search));
  });

  readonly selectedMinistryName = computed(() => {
    const id = this.installmentForm().ministry_id;
    if (!id) return 'اختر جهة العمل';
    return this.ministries().find((m) => m.id === id)?.name_ar ?? 'اختر جهة العمل';
  });

  selectMinistry(id: number): void {
    this.updateInstallmentForm('ministry_id', id);
    this.ministryDropdownOpen.set(false);
    this.ministrySearch.set('');
  }

  readonly showInstallmentSuccessModal = signal(false);

  // ───────────────── STATE ─────────────────
  readonly cart = signal<CartSummary | null>(null);
  readonly installmentPlans = signal<InstallmentPlan[]>([]);
  readonly backendCartData = signal<BackendCartData | null>(null);

  readonly loading = signal(true);
  readonly plansLoading = signal(false);
  readonly removingId = signal<number | null>(null);

  readonly selectedPayment = signal<'cash' | 'installment' | null>(null);
  readonly selectedInstallmentPlan = signal<number | null>(null);
  readonly checkoutLoading = signal(false);
  readonly showPlansModal = signal(false);

  // Cash Modal
  readonly showCashModal = signal(false);
  readonly cashForm = signal<CashOrderForm>({
    shipping_name: '',
    shipping_phone: '',
    full_address: '',
    shipping_city: '',
    shipping_area: '',
    shipping_block: '',
    shipping_street: '',
    shipping_building: '',
    shipping_floor: '',
    shipping_apartment: '',
    shipping_notes: '',
    notes: '',
  });

  readonly cashFormErrors = signal<Partial<Record<keyof CashOrderForm, string>>>({});
  readonly showShippingInfoModal = signal(false);

  // Installment Form Modal
  readonly showInstallmentFormModal = signal(false);
  readonly installmentForm = signal<InstallmentOrderForm>({
    phone: '',
    monthly_salary: 0,
    ministry_id: 0,
    full_name: '',
    civil_id: '',
    work_phone: '',
    notes: '',
  });
  readonly installmentFormErrors = signal<Partial<Record<keyof InstallmentOrderForm, string>>>({});

  // Salary modal
  readonly showSalaryModal = signal(false);
  readonly salaryInput = signal<number | null>(null);
  readonly salaryError = signal('');
  readonly pendingOrderId = signal<number | null>(null);
  readonly installmentSubmitLoading = signal(false);

  // Coupon
  readonly couponCode = signal('');
  readonly couponError = signal<string | null>(null);
  readonly couponSuccess = signal(false);
  readonly couponLoading = signal(false);

  // ───────────────── PRICE PARSER ─────────────────
  private parsePrice(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;

    let str = String(value).trim();

    if (str.includes(',') && str.includes('.')) {
      if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else if (str.includes(',')) {
      str = str.replace(/,/g, '');
    } else if (str.includes('.')) {
      const afterDot = str.split('.')[1];
      if (afterDot && afterDot.length === 3 && /^\d{3}$/.test(afterDot)) {
        str = str.replace('.', '');
      }
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // ───────────────── COMPUTED ─────────────────
  readonly totalProducts = computed(
    () => this.cart()?.cart_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  );

  readonly finalTotal = computed(() => {
    const items = this.cart()?.cart_items ?? [];
    this.backendCartData();

    return items.reduce((total, item) => {
      return total + this.getItemDisplayPrice(item) * item.quantity;
    }, 0);
  });

  readonly subtotal = computed(() => {
    const items = this.cart()?.cart_items ?? [];
    const backendData = this.backendCartData();

    return items.reduce((total, item) => {
      const bp = backendData?.products.find((p) => p.id === item.product_id);
      const bpOriginal = this.parsePrice(bp?.original_price);
      if (bpOriginal > 0 && bpOriginal >= this.getItemDisplayPrice(item)) {
        return total + bpOriginal * item.quantity;
      }

      const itemPrice = this.parsePrice(item.price);
      if (itemPrice > 0) return total + itemPrice * item.quantity;

      const net = this.parsePrice(item.product?.net_price);
      if (net > 0) return total + net * item.quantity;

      const price = this.parsePrice(item.product?.price);
      return total + price * item.quantity;
    }, 0);
  });

  readonly totalDiscount = computed(() => this.backendCartData()?.total_discount ?? 0);

  readonly selectedPlan = computed(() => {
    const planId = this.selectedInstallmentPlan();
    if (!planId) return null;
    return this.installmentPlans().find((p) => p.id === planId) ?? null;
  });

  readonly installmentTotal = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return this.finalTotal();
    return this.calculatePlanTotal(plan);
  });

  readonly displayTotal = computed(() =>
    this.selectedPayment() === 'installment' ? this.installmentTotal() : this.finalTotal(),
  );

  // ───────────────── SHIPPING / TAX / GRAND TOTAL ─────────────────
  currencySymbol(): string {
    return this.setting()?.shipping_data?.currency_symbol || 'د.ك';
  }

  shippingCost(): number {
    return Number(this.setting()?.shipping_data?.shipping_cost || 0);
  }

  freeShippingMin(): number {
    return Number(this.setting()?.shipping_data?.free_shipping_min || 0);
  }

  taxRate(): number {
    return Number(this.setting()?.shipping_data?.tax_rate || 0);
  }

  taxRateDisplay(): string {
    return this.taxRate().toFixed(2);
  }

  readonly shippingAmount = computed(() => {
    if (this.selectedPayment() !== 'cash') return 0;
    const subtotal = this.finalTotal();
    const freeMin = this.freeShippingMin();
    const shipping = this.shippingCost();
    if (!shipping || shipping <= 0) return 0;
    if (freeMin > 0 && subtotal >= freeMin) return 0;
    return shipping;
  });

  readonly taxAmount = computed(() => {
    if (this.selectedPayment() !== 'cash') return 0;
    const subtotal = this.finalTotal();
    const taxRate = this.taxRate();
    return Math.round(subtotal * (taxRate / 100) * 1000) / 1000;
  });

  readonly grandTotal = computed(() => {
    if (this.selectedPayment() === 'installment') {
      return this.installmentTotal();
    }
    return this.finalTotal() + this.shippingAmount() + this.taxAmount();
  });

  // ───────────────── INIT ─────────────────
  ngOnInit(): void {
    this.siteSettingService.loadSettings().subscribe();

    this.cartService
      .getMinistries()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.ministries.set(data));

    if (!this.cartService.isLoggedIn()) {
      const guestItems = this.cartService.getGuestCart();
      const guestCart: CartSummary = {
        id: 0,
        user_id: 0,
        cart_items: guestItems.map((item, index) => {
          const net = this.parsePrice(item.product.net_price);
          const price = this.parsePrice(item.product.price);
          return {
            id: index,
            cart_id: 0,
            product_id: item.product_id,
            quantity: item.quantity,
            price: net > 0 ? net : price,
            product: item.product,
            // [تعديل] حذف variant — لم نعد نمرر الفاريانت في بيانات السلة
          };
        }),
      };
      this.cart.set(guestCart);
      this.loading.set(false);

      if (guestItems.length) {
        const products = guestItems.map((i) => ({ product_id: i.product_id }));
        this.cartService
          .getCartInstallmentPlans(products)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.installmentPlans.set(res.data.installment_plans ?? []);
              this.backendCartData.set(res.data.cart ?? null);
            },
            error: () => {},
          });
      }

      return;
    }

    // ── Logged in flow ──
    this.cartService
      .getUserCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          if (!cart) {
            this.cart.set(null);
            this.loading.set(false);
            return;
          }

          // [تعديل] حذف available_variants من الـ mapping — لم نعد نحتاج بيانات الفاريانت
          const cartWithoutVariants = {
            ...cart,
            cart_items: cart.cart_items.map((item) => ({
              ...item,
            })),
          };

          this.cart.set(cartWithoutVariants);
          this.loading.set(false);

          const items = cartWithoutVariants.cart_items ?? [];
          if (items.length) {
            const products = items.map((i) => ({
              product_id: i.product_id,
              ...(i.offer_code ? { offer_code: i.offer_code } : {}),
            }));

            this.cartService
              .getCartInstallmentPlans(products)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (res) => {
                  this.installmentPlans.set(res.data.installment_plans ?? []);
                  this.backendCartData.set(res.data.cart ?? null);
                },
                error: (err) => {
                  console.error('Installment plans error:', err);
                },
              });
          }

          // ── تطبيق pending coupon بعد اللوجن ──
          this.applyPendingCouponIfExists();
          this.applyPendingOfferCouponIfExists();
        },
        error: () => {
          this.cart.set(null);
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ───────────────── PENDING COUPON (بعد redirect من اللوجن) ─────────────────
  private applyPendingCouponIfExists(): void {
    const pendingCoupon = sessionStorage.getItem('pendingCoupon');
    if (!pendingCoupon || !this.cartService.isLoggedIn()) return;

    sessionStorage.removeItem('pendingCoupon');
    this.couponCode.set(pendingCoupon);

    setTimeout(() => this.applyCoupon(), 400);
  }

  private applyPendingOfferCouponIfExists(): void {
  const pendingCoupon = sessionStorage.getItem('pendingOfferCoupon');
  if (!pendingCoupon || !this.cartService.isLoggedIn()) return;

  sessionStorage.removeItem('pendingOfferCoupon');
  this.couponCode.set(pendingCoupon);

  setTimeout(() => this.applyCoupon(), 400);
}
  // ───────────────── QUANTITY ─────────────────
  increaseQty(item: CartItem): void {
    // [تعديل] حذف شرط canIncrease المرتبط بالمخزون — الكمية تزيد دايمًا بدون قيود
    const cartValue = this.cart();
    if (!cartValue) return;

    const updatedItems = cartValue.cart_items.map((i) =>
      i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
    );

    this.cart.set({ ...cartValue, cart_items: updatedItems });

    if (!this.cartService.isLoggedIn()) {
      const guestItems = updatedItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        product: i.product,
      }));
      this.cartService.saveGuestCart(guestItems);
    }
  }

  decreaseQty(item: CartItem): void {
    // [تعديل] حذف شرط canDecrease المرتبط بالمخزون — الحد الأدنى للكمية هو 1 فقط
    if (item.quantity <= 1) return;

    const cartValue = this.cart();
    if (!cartValue) return;

    const updatedItems = cartValue.cart_items.map((i) =>
      i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
    );

    this.cart.set({ ...cartValue, cart_items: updatedItems });

    if (!this.cartService.isLoggedIn()) {
      const guestItems = updatedItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        product: i.product,
      }));
      this.cartService.saveGuestCart(guestItems);
    }
  }

  // [تعديل] canIncrease دايمًا true — المخزون ثابت 10000 في الـ backend
  canIncrease(item: CartItem): boolean {
    return true;
  }

  // [تعديل] canDecrease بيتحقق من الكمية > 1 فقط بدون أي منطق مخزون
  canDecrease(item: CartItem): boolean {
    return item.quantity > 1;
  }

  getItemDisplayPrice(item: CartItem): number {
    const itemFinalPrice = this.parsePrice((item as any).final_price);
    if (itemFinalPrice > 0) return itemFinalPrice;

    const itemPrice = this.parsePrice(item.price);
    if (itemPrice > 0) return itemPrice;

    const net = this.parsePrice(item.product?.net_price);
    if (net > 0) return net;

    const price = this.parsePrice(item.product?.price);
    if (price > 0) return price;

    const backendProduct = this.getBackendProduct(item.product_id);
    const backendFinal = this.parsePrice(backendProduct?.final_price);
    if (backendFinal > 0) return backendFinal;

    const backendOriginal = this.parsePrice(backendProduct?.original_price);
    if (backendOriginal > 0) return backendOriginal;

    return 0;
  }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.key;
    if (!/[0-9.]/.test(charCode)) {
      event.preventDefault();
      return false;
    }
    const input = (event.target as HTMLInputElement).value;
    if (charCode === '.' && input.includes('.')) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // ───────────────── REMOVE ─────────────────
  removeItem(id: number): void {
    if (!this.cartService.isLoggedIn()) {
      const guestItems = this.cartService.getGuestCart();
      const updatedItems = guestItems.filter((_, index) => index !== id);
      this.cartService.saveGuestCart(updatedItems);

      const guestCart: CartSummary = {
        id: 0,
        user_id: 0,
        cart_items: updatedItems.map((item, index) => {
          const net = this.parsePrice(item.product.net_price);
          const price = this.parsePrice(item.product.price);
          return {
            id: index,
            cart_id: 0,
            product_id: item.product_id,
            quantity: item.quantity,
            price: net > 0 ? net : price,
            product: item.product,
            // [تعديل] حذف variant من guest cart items
          };
        }),
      };

      this.cart.set(guestCart);
      return;
    }

    this.removingId.set(id);
    this.cartService
      .removeCartItem(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.removingId.set(null);
        },
        error: () => this.removingId.set(null),
      });
  }

  // ───────────────── BACKEND PRODUCT HELPER ─────────────────
  getBackendProduct(productId: number): BackendCartProduct | null {
    return this.backendCartData()?.products.find((p) => p.id === productId) ?? null;
  }

  // ───────────────── PAYMENT ─────────────────
  selectPayment(method: 'cash' | 'installment'): void {
    if (this.selectedPayment() === method) {
      this.selectedPayment.set(null);
      this.selectedInstallmentPlan.set(null);
      return;
    }
    this.selectedPayment.set(method);
    if (method === 'installment') {
      this.showPlansModal.set(true);
    } else {
      this.selectedInstallmentPlan.set(null);
    }
  }

  selectInstallmentPlan(planId: number): void {
    this.selectedInstallmentPlan.set(planId);
    this.selectedPayment.set('installment');
  }

  // ───────────────── CHECKOUT ─────────────────
  checkout(): void {
    if (!this.selectedPayment()) {
      this.toastr.warning('اختر طريقة الدفع');
      return;
    }
    if (this.selectedPayment() === 'installment' && !this.selectedInstallmentPlan()) {
      this.toastr.warning('اختر خطة التقسيط');
      return;
    }
    if (this.selectedPayment() === 'cash') {
      this.showCashModal.set(true);
      return;
    }
    if (this.selectedPayment() === 'installment') {
      this.showInstallmentFormModal.set(true);
      return;
    }
  }

  // ───────────────── CASH FORM ─────────────────
  updateCashForm(field: keyof CashOrderForm, value: string): void {
    this.cashForm.update((f) => ({ ...f, [field]: value }));
    this.cashFormErrors.update((e) => ({ ...e, [field]: '' }));
  }

  validateCashForm(): boolean {
    const f = this.cashForm();
    const errors: Partial<Record<keyof CashOrderForm, string>> = {};

    if (!f.shipping_name?.trim()) errors.shipping_name = 'هذا الحقل مطلوب';

    if (!f.shipping_phone?.trim()) {
      errors.shipping_phone = 'هذا الحقل مطلوب';
    } else if (!/^[0-9]{8}$/.test(f.shipping_phone.trim())) {
      errors.shipping_phone = 'رقم الهاتف يجب أن يكون 8 أرقام';
    }

    if (!f.full_address?.trim()) errors.full_address = 'هذا الحقل مطلوب';

    this.cashFormErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submitCashOrder(): void {
    if (!this.validateCashForm()) return;

    const isGuest = !this.cartService.isLoggedIn();

    const offerCode = this.cart()?.cart_items?.find((i) => i.offer_code)?.offer_code ?? null;

    // [تعديل] حذف variant من items — الطلب يُرسل بدون بيانات الفاريانت
    const items =
      this.cart()?.cart_items?.map((item) =>
        isGuest
          ? { product_id: item.product_id, quantity: item.quantity }
          : { product_id: item.product_id, cart_item_id: item.id, quantity: item.quantity },
      ) ?? [];

    const data: CheckoutRequest = {
      payment_type: 'cash',
      total_amount: this.grandTotal(),
      items,
      ...(offerCode ? { offer_code: offerCode } : {}),
      ...this.cashForm(),
    };

    this.checkoutLoading.set(true);

    this.cartService
      .checkout(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkoutLoading.set(false);
          this.showCashModal.set(false);
          this.showShippingInfoModal.set(true);
          this.cartService.clearCart();
          this.cartService.clearGuestCart();
          this.cart.set(null);
          this.couponCode.set('');
          this.couponSuccess.set(false);
          this.toastr.success('تم إنشاء الطلب بنجاح!');
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          this.toastr.error(err?.error?.message || 'حدث خطأ أثناء إنشاء الطلب');
        },
      });
  }

  submitInstallmentOrder(): void {
    if (!this.validateInstallmentForm()) return;

    const isGuest = !this.cartService.isLoggedIn();

    const offerCode = this.cart()?.cart_items?.find((i) => i.offer_code)?.offer_code ?? null;

    // [تعديل] حذف variant من items — الطلب يُرسل بدون بيانات الفاريانت
    const items =
      this.cart()?.cart_items?.map((item) =>
        isGuest
          ? { product_id: item.product_id, quantity: item.quantity }
          : { product_id: item.product_id, cart_item_id: item.id, quantity: item.quantity },
      ) ?? [];

    const form = this.installmentForm();

    const data: CheckoutRequest = {
      payment_type: 'installment',
      installment_plan_id: this.selectedInstallmentPlan()!,
      total_amount: this.installmentTotal(),
      items,
      ...(offerCode ? { offer_code: offerCode } : {}),
      phone: form.phone,
      shipping_phone: form.phone,
      shipping_name: form.full_name,
      monthly_salary: form.monthly_salary,
      ministry_id: form.ministry_id,
      civil_id: form.civil_id,
      work_phone: form.work_phone,
      notes: form.notes,
    };

    this.checkoutLoading.set(true);

    this.cartService
      .checkout(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkoutLoading.set(false);
          this.showInstallmentFormModal.set(false);
          this.cartService.clearCart();
          this.cartService.clearGuestCart();
          this.cart.set(null);
          this.couponCode.set('');
          this.couponSuccess.set(false);
          this.toastr.success('تم إنشاء الطلب بنجاح!');
          this.showInstallmentSuccessModal.set(true);
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          this.toastr.error(err?.error?.message || 'حدث خطأ أثناء إنشاء الطلب');
        },
      });
  }

  // ───────────────── INSTALLMENT FORM ─────────────────
  updateInstallmentForm(field: keyof InstallmentOrderForm, value: string | number): void {
    this.installmentForm.update((f) => ({ ...f, [field]: value }));
    this.installmentFormErrors.update((e) => ({ ...e, [field]: '' }));
  }

  validateInstallmentForm(): boolean {
    const f = this.installmentForm();
    const errors: Partial<Record<keyof InstallmentOrderForm, string>> = {};

    if (!f.phone?.trim()) {
      errors.phone = 'هذا الحقل مطلوب';
    } else if (!/^[0-9]{8}$/.test(f.phone.trim())) {
      errors.phone = 'رقم الهاتف يجب أن يكون 8 أرقام';
    }

    if (!f.monthly_salary || f.monthly_salary <= 0) {
      errors.monthly_salary = 'هذا الحقل مطلوب';
    } else if (isNaN(Number(f.monthly_salary))) {
      errors.monthly_salary = 'يجب أن يكون رقماً صحيحاً';
    }

    if (!f.ministry_id || f.ministry_id <= 0) {
      errors.ministry_id = 'هذا الحقل مطلوب';
    }

    if (!f.full_name?.trim()) {
      errors.full_name = 'هذا الحقل مطلوب';
    } else if (f.full_name.trim().length < 3) {
      errors.full_name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (f.civil_id?.trim()) {
      if (!/^[0-9]{12}$/.test(f.civil_id.trim())) {
        errors.civil_id = 'الرقم المدني يجب أن يكون 12 رقماً';
      }
    }

    if (f.work_phone !== undefined && f.work_phone?.trim()) {
      if (!/^[0-9]{8}$/.test(f.work_phone.trim())) {
        errors.work_phone = 'رقم الهاتف يجب أن يكون 8 أرقام';
      }
    }

    this.installmentFormErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  // ───────────────── SALARY MODAL ─────────────────
  onSalaryChange(value: string): void {
    const num = parseFloat(value);
    this.salaryInput.set(isNaN(num) ? null : num);
    this.salaryError.set('');
  }

  submitSalary(): void {
    const salary = this.salaryInput();
    const orderId = this.pendingOrderId();

    if (!salary || salary <= 0) {
      this.salaryError.set('يرجى إدخال راتب صحيح');
      return;
    }
    if (!orderId) {
      this.salaryError.set('حدث خطأ، لا يوجد رقم طلب');
      return;
    }

    this.installmentSubmitLoading.set(true);
    this.cartService
      .submitInstallmentRequest({ order_id: orderId, monthly_salary: salary })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.installmentSubmitLoading.set(false);
          this.showSalaryModal.set(false);
          this.toastr.success('تم إرسال طلب التقسيط بنجاح!');
        },
        error: (err) => {
          this.salaryError.set(err.error?.message || 'حدث خطأ في إرسال طلب التقسيط');
          this.installmentSubmitLoading.set(false);
        },
      });
  }

  closeSalaryModal(): void {
    this.showSalaryModal.set(false);
  }

  // ───────────────── COUPON ─────────────────
  applyCoupon(): void {
    const code = this.couponCode().trim();

    if (!code) {
      this.couponError.set('يرجى إدخال كود الخصم');
      this.couponSuccess.set(false);
      return;
    }

    if (!this.cartService.isLoggedIn()) {
      sessionStorage.setItem('pendingCoupon', code);
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' },
      });
      return;
    }

    const currentCart = this.cart();
    if (!currentCart) return;

    const existingOfferCode = currentCart.cart_items
      .map((i) => i.offer_code)
      .find((c) => !!c && c !== code);

    if (existingOfferCode) {
      this.couponError.set(
        `الكارت يحتوي على عرض مختلف (${existingOfferCode})، لا يمكن تطبيق عرضين في نفس الوقت`,
      );
      this.couponSuccess.set(false);
      return;
    }

    this.couponLoading.set(true);
    this.couponError.set(null);

    this.cartService
      .verifyOfferCode(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (verifyRes: VerifyOfferResponse) => {
          if (!verifyRes.success) {
            this.couponError.set(verifyRes.message || 'كود الخصم غير صالح');
            this.couponSuccess.set(false);
            this.couponLoading.set(false);
            return;
          }

          const offerProductIds: number[] =
            verifyRes.data?.offer?.products?.map((p) => p.id) ?? [];

          const items = currentCart.cart_items;

          const matchingItems =
            offerProductIds.length === 0
              ? items
              : items.filter((i) => offerProductIds.includes(i.product_id));

          if (matchingItems.length === 0) {
            this.couponError.set('كود الخصم غير صالح لأي منتج في السلة');
            this.couponSuccess.set(false);
            this.couponLoading.set(false);
            return;
          }

          const baselineRequest$ = this.cartService.getCartInstallmentPlans(
            items.map((i) => ({ product_id: i.product_id })),
          );

          const couponRequests$ = matchingItems.map((item) =>
            this.cartService
              .getCartInstallmentPlans([{ product_id: item.product_id, offer_code: code }])
              .pipe(
                map((res) => ({
                  product_id: item.product_id,
                  backendProduct:
                    res.data.cart?.products?.find((p) => p.id === item.product_id) ?? null,
                })),
                catchError(() =>
                  of({
                    product_id: item.product_id,
                    backendProduct: null as BackendCartProduct | null,
                  }),
                ),
              ),
          );

          forkJoin({
            baseline: baselineRequest$,
            couponResults: forkJoin(couponRequests$),
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: ({ baseline, couponResults }) => {
                const baselineProducts = baseline.data.cart?.products ?? [];

                const anySuccess = couponResults.some(
                  (r) => r.backendProduct?.discount_applied,
                );

                if (!anySuccess) {
                  this.couponError.set('كود الخصم غير صالح لأي منتج في السلة');
                  this.couponSuccess.set(false);
                  this.couponLoading.set(false);
                  return;
                }

                const finalProducts: BackendCartProduct[] = items.map((item) => {
                  const couponResult = couponResults.find(
                    (r) => r.product_id === item.product_id,
                  );

                  if (couponResult?.backendProduct?.discount_applied) {
                    return couponResult.backendProduct;
                  }

                  const baselineProduct = baselineProducts.find(
                    (p) => p.id === item.product_id,
                  );
                  if (baselineProduct) return baselineProduct;

                  const itemPrice =
                    this.parsePrice(item.price) ||
                    this.parsePrice(item.product?.net_price) ||
                    this.parsePrice(item.product?.price);

                  return {
                    id: item.product_id,
                    name: item.product.name,
                    sku: '',
                    original_price: itemPrice,
                    final_price: itemPrice,
                    discount_applied: false,
                    offer_code: null,
                    discount_percent: 0,
                    discount_amount: 0,
                  } as BackendCartProduct;
                });

                const updatedItems: CartItem[] = currentCart.cart_items.map((item) => {
                  const fp = finalProducts.find((p) => p.id === item.product_id);
                  if (!fp) return item;
                  return {
                    ...item,
                    final_price: Number(fp.final_price),
                    offer_code: fp.discount_applied ? code : item.offer_code,
                  };
                });

                this.cart.set({ ...currentCart, cart_items: updatedItems });

                const subtotal = finalProducts.reduce((sum, fp) => {
                  const item = currentCart.cart_items.find((i) => i.product_id === fp.id);
                  return sum + Number(fp.final_price) * (item?.quantity ?? 1);
                }, 0);

                const totalDiscount = finalProducts.reduce((sum, fp) => {
                  if (!fp.discount_applied) return sum;
                  const item = currentCart.cart_items.find((i) => i.product_id === fp.id);
                  const diff = Number(fp.original_price) - Number(fp.final_price);
                  return sum + diff * (item?.quantity ?? 1);
                }, 0);

                this.backendCartData.set({
                  products: finalProducts,
                  products_count: finalProducts.length,
                  subtotal,
                  total_discount: totalDiscount,
                  total: subtotal,
                });

                this.installmentPlans.set(baseline.data.installment_plans ?? []);
                this.couponSuccess.set(true);
                this.couponError.set(null);
                this.couponLoading.set(false);
              },
              error: () => {
                this.couponError.set('حدث خطأ، حاول مرة أخرى');
                this.couponSuccess.set(false);
                this.couponLoading.set(false);
              },
            });
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'كود الخصم غير صالح';
          this.couponError.set(msg);
          this.couponSuccess.set(false);
          this.couponLoading.set(false);
        },
      });
  }

  onCouponInput(value: string): void {
    this.couponCode.set(value);
    this.couponError.set(null);
    this.couponSuccess.set(false);
  }

  // ───────────────── PLANS MODAL ─────────────────
  closePlansModal(): void {
    this.showPlansModal.set(false);
  }

  confirmPlan(planId: number): void {
    this.selectedInstallmentPlan.set(planId);
    this.showPlansModal.set(false);
  }

  cancelInstallment(): void {
    this.closePlansModal();
    this.selectedPayment.set(null);
    this.selectedInstallmentPlan.set(null);
  }

  // ───────────────── PLAN CALCULATIONS ─────────────────
  calculatePlanTotal(plan: InstallmentPlan): number {
    const subtotal = this.finalTotal();
    const interestRate = +(plan.interest_rate ?? 0) / 100;
    const adminFee = +(plan.admin_fee ?? 0);
    const downPayment = +(plan.down_payment ?? 0);

    return subtotal + subtotal * interestRate + adminFee + downPayment;
  }

  calculatePlanMonthly(plan: InstallmentPlan): number {
    const total = this.calculatePlanTotal(plan);
    const downPayment = +(plan.down_payment ?? 0);
    const duration = +(plan.duration_months ?? 1);

    const remaining = total - downPayment;
    return remaining / duration;
  }
}
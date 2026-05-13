import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OffersService } from '../../core/services/offers.service';
import { CartService } from '../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [CommonModule, RouterLink, BackButton],
  templateUrl: './offer-details.html',
  styleUrl: './offer-details.css',
})
export class OfferDetails implements OnInit {
  private offersService = inject(OffersService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private toastr = inject(ToastrService);

  offer: any = null;
  loading = true;
  isAddingToCart = false;
  addingProductId: number | null = null;

  // ✅ شيلنا selectedVariants خالص - مبقاش في فارينتس في المشروع
  copiedCode = false;

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadOfferDetails(+id);
  }

  loadOfferDetails(id: number) {
    this.loading = true;
    this.offersService.getOfferDetails(id).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.offer = res?.data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loading = false;
          this.router.navigate(['/offers']);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ✅ شيلنا selectVariant خالص - مبقاش في فارينتس

  /** Copy coupon code to clipboard with feedback */
  copyCoupon(code: string): void {
    if (!code) return;

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.warn('Copy failed', e);
      }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    this.copiedCode = true;
    this.toastr.success('تم نسخ الكود ✅');
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.copiedCode = false;
        this.cdr.detectChanges();
      });
    }, 2500);
  }

  addToCart(productId: number) {
    if (this.isAddingToCart) return;

    const raw = this.offer?.products?.find((p: any) => p.id === productId);

    if (!raw) {
      this.toastr.error('حدث خطأ: المنتج غير موجود');
      return;
    }

    // ✅ بناء المنتج بدون أي حاجة متعلقة بالفارينتس
    // ✅ stock مش بنبعتهوش - المخزون دايمًا 10000 في الـ endpoint فالإضافة هتتم عادي
    const mappedProduct = {
      ...raw,
      price: raw?.discounted_price ?? raw?.original_price ?? 0,
      sale_price: raw?.discounted_price ?? null,
      cover_image: raw?.cover_image ?? '',
    };

    this.isAddingToCart = true;
    this.addingProductId = productId;

    // ✅ بنبعت productId والكمية بس من غير variant
    this.cartService.addToCart(productId, 1, mappedProduct as any).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isAddingToCart = false;
          this.addingProductId = null;
          this.toastr.success('تم إضافة المنتج للسلة ✅');

          // ✅ لو في كوبون للعرض بنحطه في sessionStorage عشان الكارت يلاقيه
          if (this.offer?.offer_code) {
            sessionStorage.setItem('pendingOfferCoupon', this.offer.offer_code);
          }

          this.router.navigate(['/cart']);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error(err);
          this.toastr.error(err?.error?.message ?? 'حدث خطأ أثناء الإضافة');
          this.isAddingToCart = false;
          this.addingProductId = null;
          this.cdr.detectChanges();
        });
      }
    });
  }

  formatPrice(price: number): string {
    if (!price && price !== 0) return '0.000';
    return Number(price).toFixed(3);
  }
}
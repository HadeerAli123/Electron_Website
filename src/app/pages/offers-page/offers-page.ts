import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { OffersService } from '../../core/services/offers.service';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [HeroSection, CommonModule, BackButton],
  templateUrl: './offers-page.html',
  styleUrl: './offers-page.css',
})
export class OffersPage implements OnInit {

  private offersService = inject(OffersService);
  private cartService = inject(CartService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  featuredOffer: any[] = [];
  offers: any[] = [];
  loading = true;
  isAddingToCart = false;
  copiedCode: string | null = null;

<<<<<<< HEAD
  // ✅ شيلنا selectedVariants و addingProductId - مبقاش في فارينتس

=======
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.loading = true;
    this.offersService.getOffers().subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          const apiOffers = res?.data?.offers || [];
          this.featuredOffer = apiOffers.filter((o: any) => o.is_featured);
          this.offers = apiOffers.filter((o: any) => !o.is_featured);
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('❌ Error loading offers:', error);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  get allOffers(): any[] {
    const featured = this.featuredOffer.map(o => ({ ...o, is_featured: true }));
    const regular = this.offers.map(o => ({ ...o, is_featured: false }));
    return [...featured, ...regular];
  }

  /** Copy coupon code to clipboard with visual feedback */
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

    this.copiedCode = code;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.copiedCode = null;
        this.cdr.detectChanges();
      });
    }, 2000);
  }

<<<<<<< HEAD
  // ✅ شيلنا addFeaturedToCart القديمة - مبقاش بنحتاجها
=======
  addFeaturedToCart() {
    const firstProduct = this.getFirstProduct(this.featuredOffer);
    if (!firstProduct || this.isAddingToCart) return;

    this.isAddingToCart = true;

    this.cartService.addToCart(firstProduct.id, 1).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.isAddingToCart = false;
          this.router.navigate(['/cart']);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('❌ Error adding to cart:', err);
          alert('حدث خطأ أثناء الإضافة');
          this.isAddingToCart = false;
          this.cdr.detectChanges();
        });
      }
    });
  }
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a

  getFirstProduct(offer: any): any {
    return offer?.products?.length ? offer.products[0] : null;
  }

  getFirstTwoProducts(offer: any): any[] {
    return (offer?.products as any[])?.slice(0, 2) ?? [];
  }

  formatPrice(price: number): string {
<<<<<<< HEAD
    // ✅ السعر بييجي كامل من الـ API - بس بنعرضه بـ 3 خانات عشرية
    return Number(price).toFixed(3);
=======
    return (price / 1000).toFixed(3);
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
  }
}
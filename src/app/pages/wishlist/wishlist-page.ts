import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { WishlistService, WishlistItem } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { SiteSettingService } from '../../core/services/site-setting.service';
import { QuickViewButton } from '../../shared/components/quick-view-button/quick-view-button';
import { BackButton } from '../../shared/components/back-button/back-button';

type SortBy = 'recent' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickViewButton, BackButton],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.css',
})
export class WishlistPage {

  private wishlist = inject(WishlistService);
  private cart = inject(CartService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private siteSettings = inject(SiteSettingService);

  items = this.wishlist.wishlist;
  count = this.wishlist.count;

  sortBy = signal<SortBy>('recent');
  isClearing = signal(false);
  addingToCartId = signal<number | null>(null);

  /** Sorted items based on sortBy */
  sortedItems = computed<WishlistItem[]>(() => {
    const list = [...this.items()];
    const sort = this.sortBy();
    switch (sort) {
      case 'recent':
        return list.sort((a, b) => (b.added_at ?? 0) - (a.added_at ?? 0));
      case 'price-asc':
        return list.sort((a, b) => this.getPrice(a) - this.getPrice(b));
      case 'price-desc':
        return list.sort((a, b) => this.getPrice(b) - this.getPrice(a));
      case 'name':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
      default:
        return list;
    }
  });

  /** Total value of wishlist items */
  totalValue = computed(() =>
    this.items().reduce((sum, i) => sum + this.getPrice(i), 0)
  );

  // ─── Actions ──────────────────────────────────
  setSort(sort: SortBy): void {
    this.sortBy.set(sort);
  }

  removeItem(event: Event, item: WishlistItem): void {
    event.stopPropagation();
    this.wishlist.remove(item.id);
    this.toastr.info(`تم حذف "${item.name}" من المفضلة`);
  }

  clearAll(): void {
    if (!this.count()) return;
    this.isClearing.set(true);
    setTimeout(() => {
      this.wishlist.clearAll();
      this.toastr.info('تم مسح كل المفضلة');
      this.isClearing.set(false);
    }, 200);
  }

  goToProduct(item: WishlistItem): void {
    this.router.navigate(['/product', item.id]);
  }
  addToCart(event: Event, item: WishlistItem): void {
    event.stopPropagation();
    
    // إزالة التحقق من المخزون (المنتج دائمًا متوفر)
    if (this.addingToCartId() === item.id) return;

    this.addingToCartId.set(item.id);

    this.cart.addToCart(
      item.id, 
      1, 
      item as any          // product object فقط
    ).subscribe({
      next: () => {
        this.toastr.success('تم إضافة المنتج للسلة ✅');
        this.addingToCartId.set(null);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err?.error?.message || 'حدث خطأ أثناء الإضافة');
        this.addingToCartId.set(null);
      }
    });
  }

  /** Add all items to cart */
  addAllToCart(): void {
    const allItems = this.items(); // إزالة فلتر المخزون
    
    if (!allItems.length) {
      this.toastr.warning('لا توجد منتجات في قائمة الرغبات');
      return;
    }

    let added = 0;

    allItems.forEach(item => {
      this.cart.addToCart(
        item.id, 
        1, 
        item as any
      ).subscribe({
        next: () => {
          added++;
          if (added === allItems.length) {
            this.toastr.success(`تم إضافة ${added} منتج للسلة ✅`);
          }
        },
        error: (err) => {
          console.error(err);
          added++; // نستمر حتى لو فشل 
        }
      });
    });
  
  }

  // ─── Helpers ──────────────────────────────────
  getPrice(item: WishlistItem): number {
    const net = +(item.net_price || 0);
    return net > 0 ? net : +(item.price || 0);
  }

  hasDiscount(item: WishlistItem): boolean {
    const net = +(item.net_price || 0);
    const price = +(item.price || 0);
    return net > 0 && net < price;
  }

  getDiscountPercent(item: WishlistItem): number {
    if (!this.hasDiscount(item)) return 0;
    const price = +(item.price || 0);
    const net = +(item.net_price || 0);
    return Math.round(((price - net) / price) * 100);
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? url : '/' + url;
  }

  currencySymbol(): string {
    return this.siteSettings.getCurrencySymbol?.() || 'د.ك';
  }
}
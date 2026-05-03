import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { CategoriesService } from '../../../core/services/categories.service';
import { CartService } from '../../../core/services/cart.service';
import { SiteSettingService } from '../../../core/services/site-setting.service';
import { WishlistButton } from '../wishlist-button/wishlist-button';
import { PriceFormatPipe } from '../pipes/price-format.pipe';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [CommonModule, WishlistButton, PriceFormatPipe],
  templateUrl: './quick-view-modal.html',
  styleUrl: './quick-view-modal.css',
})
export class QuickViewModal implements OnInit, OnDestroy {
  @Input({ required: true }) product!: any;
  @Output() close = new EventEmitter<void>();

  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  private siteSettings = inject(SiteSettingService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private elRef = inject(ElementRef);

  // ─── State ──────────────────────────────────
  fullProduct = signal<any>(null);
  isLoading = signal(true);
  selectedImageIndex = signal(0);
  quantity = signal(1);
  isAddingToCart = signal(false);

  // ─── Computed ──────────────────────────────────

  /** All images: cover + extra images */
  images = computed<string[]>(() => {
    const p = this.fullProduct() ?? this.product;
    const list: string[] = [];
    if (p?.cover_image) list.push(p.cover_image);
    if (p?.images?.length) {
      p.images.forEach((img: any) => {
        const path = img?.image_path ?? img;
        if (typeof path === 'string' && path && !list.includes(path)) {
          list.push(path);
        }
      });
    }
    return list;
  });

  hasGallery = computed(() => this.images().length > 1);

  currentImage = computed(() => {
    const imgs = this.images();
    if (!imgs.length) return null;
    const idx = Math.min(this.selectedImageIndex(), imgs.length - 1);
    return imgs[idx];
  });
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

originalPrice = computed(() => {
  const p = this.fullProduct() ?? this.product;
  return this.parsePrice(p?.price);
});

currentPrice = computed(() => {
  const p = this.fullProduct() ?? this.product;
  if (!p) return 0;
  const net = this.parsePrice(p.net_price);
  return net > 0 ? net : this.originalPrice();
});

hasDiscount = computed(() => {
  const original = this.originalPrice();
  const current = this.currentPrice();
  return original > 0 && current > 0 && current < original;
});

discountPercent = computed(() => {
  if (!this.hasDiscount()) return 0;
  const original = this.originalPrice();
  const current = this.currentPrice();
  return Math.round(((original - current) / original) * 100);
});

/** قيمة التوفير */
savings = computed(() => {
  return Math.max(0, this.originalPrice() - this.currentPrice());
});

  productName = computed(() => {
    const p = this.fullProduct() ?? this.product;
    if (!p) return '';
    return (p.name?.trim() ||
            p.name_ar?.trim() ||
            p.model?.trim() ||
            'منتج').toString();
  });

  inStock = computed(() => {
    const p = this.fullProduct() ?? this.product;
    return (p?.stock ?? 0) > 0;
  });

  // ─── Lifecycle ──────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

   
    const host = this.elRef.nativeElement as HTMLElement;
    if (host && host.parentElement !== document.body) {
      document.body.appendChild(host);
    }

    this.loadFullProduct();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';

    // Clean up: remove the teleported element from body if it's still there
    const host = this.elRef.nativeElement as HTMLElement;
    if (host && host.parentElement === document.body) {
      try {
        document.body.removeChild(host);
      } catch { /* ignore */ }
    }
  }

  /** Try to fetch full product details (for description + extra images) */
  private loadFullProduct(): void {
    if (!this.product?.id) {
      this.isLoading.set(false);
      return;
    }

    // Initialize with what we have
    this.fullProduct.set(this.product);

    // Then fetch full
    this.categoriesService.getProductById(+this.product.id).subscribe({
      next: (response: any) => {
        // The service returns { product, variants, grouped_attributes }
        const fullData = response?.product ?? response;
        if (fullData) {
          // Merge: full data takes priority, fall back to passed-in product
          this.fullProduct.set({ ...this.product, ...fullData });
        }
        this.isLoading.set(false);
      },
      error: () => {
        // Use what we have
        this.isLoading.set(false);
      }
    });
  }

  // ─── Image gallery ──────────────────────────────────
  selectImage(idx: number): void {
    this.selectedImageIndex.set(idx);
  }

  nextImage(): void {
    const len = this.images().length;
    if (!len) return;
    this.selectedImageIndex.set((this.selectedImageIndex() + 1) % len);
  }

  prevImage(): void {
    const len = this.images().length;
    if (!len) return;
    this.selectedImageIndex.set((this.selectedImageIndex() - 1 + len) % len);
  }

  // ─── Quantity ──────────────────────────────────
  increaseQty(): void {
    this.quantity.update(q => q + 1);
  }

  decreaseQty(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  // ─── Cart ──────────────────────────────────
  addToCart(): void {
  if (!this.inStock() || this.isAddingToCart()) return;
  const p = this.fullProduct() ?? this.product;
  if (!p?.id) return;

  this.isAddingToCart.set(true);

  const sanitizedProduct = {
    ...p,
    price: this.originalPrice(),       // 80000 بدل "80.000"
    net_price: this.parsePrice(p.net_price),
    sale_price: this.parsePrice(p.sale_price),
  };

  this.cartService
    .addToCart(p.id, this.quantity(), undefined, sanitizedProduct as any)
    .subscribe({
      next: () => {
        this.toastr.success('تم إضافة المنتج للسلة ✅');
        this.isAddingToCart.set(false);
        setTimeout(() => this.close.emit(), 600);
      },
      error: () => {
        this.toastr.error('حدث خطأ أثناء الإضافة');
        this.isAddingToCart.set(false);
      }
    });
}

  // ─── Navigation ──────────────────────────────────
  goToFullDetails(): void {
    const p = this.fullProduct() ?? this.product;
    if (!p?.id) return;
    this.router.navigate(['/product', p.id]);
    this.close.emit();
  }

  // ─── Helpers ──────────────────────────────────
  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? url : '/' + url;
  }

  currencySymbol(): string {
    return this.siteSettings.getCurrencySymbol?.() || 'د.ك';
  }

  /** Strip HTML from description */
  shortDescription = computed(() => {
    const p = this.fullProduct() ?? this.product;
    const desc = p?.description ?? '';
    if (!desc) return '';
    // Strip HTML
    const stripped = desc.replace(/<[^>]+>/g, '').trim();
    // Truncate to ~200 chars
    if (stripped.length > 200) {
      return stripped.slice(0, 200) + '...';
    }
    return stripped;
  });

  // ─── Keyboard ──────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowLeft' && this.hasGallery()) {
      this.prevImage();
    } else if (event.key === 'ArrowRight' && this.hasGallery()) {
      this.nextImage();
    }
  }

  // ─── Backdrop ──────────────────────────────────
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}

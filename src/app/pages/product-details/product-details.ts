import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CategoriesService,
  ProductDetail,
  ProductVariant,
} from '../../core/services/categories.service';
import { CartService } from '../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { SiteSettingService } from '../../core/services/site-setting.service';
import { WishlistButton } from '../../shared/components/wishlist-button/wishlist-button';
import { BackButton } from '../../shared/components/back-button/back-button';
import { PriceFormatPipe } from '../../shared/components/pipes/price-format.pipe';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule,PriceFormatPipe, RouterLink, FormsModule, WishlistButton, BackButton],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  @ViewChild('mainImg') mainImg?: ElementRef<HTMLImageElement>;

  product?: ProductDetail;
  variants: ProductVariant[] = [];
  grouped_attributes: Record<
    string,
    { attribute_id: number; values: { attribute_value_id: number; value: string }[] }
  > = {};

  selectedImage: string = '';
  selectedAttributes: Record<string, string> = {};
  selectedVariant?: ProductVariant;

  /** Currently shown image index (for counter + nav) */
  currentImageIndex: number = 0;

  /** Image zoom magnifier state */
  isZooming: boolean = false;
  zoomOrigin: string = 'center center';

  quantity: number = 1;
  selectedPayment: 'cash' | 'installment' = 'cash';
  selectedMonths: number = 0;
  isAddingToCart = false;
  isLoading = true;

  /** Copy-link feedback */
  linkCopied: boolean = false;

  private readonly toastr = inject(ToastrService);
  readonly siteSettingService = inject(SiteSettingService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoriesService: CategoriesService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.loadProduct(id);
      window.scrollTo(0, 0);
    });
  }

  loadProduct(id: number) {
    this.isLoading = true;
    this.categoriesService.getProductById(id).subscribe({
      next: (fullDetail) => {
        this.ngZone.run(() => {
          if (!fullDetail) {
            this.router.navigate(['/categories']);
            this.isLoading = false;
            this.cdr.detectChanges();
            return;
          }

          this.product = fullDetail.product;
          this.variants = fullDetail.variants ?? [];
          this.grouped_attributes = fullDetail.grouped_attributes ?? {};
          if (this.product.images?.length) {
            this.selectedImage = this.product.images[0].image_path ?? '';
            this.currentImageIndex = 0;
          } else if (this.product.cover_image) {
            this.selectedImage = this.product.cover_image;
          }

          Object.keys(this.grouped_attributes).forEach((key) => {
            const values = this.grouped_attributes[key].values;
            if (values?.length) {
              this.selectedAttributes[key] = values[0].value;
            }
          });

          if (Object.keys(this.grouped_attributes).length) {
            this.updateVariant();
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.ngZone.run(() => {
          this.isLoading = false;
          this.router.navigate(['/categories']);
        });
      },
    });
  }

  // ══════════════════════════════════════════
  // Image Gallery
  // ══════════════════════════════════════════

  selectImage(img: { id?: number; image_path?: string }) {
    this.selectedImage = img.image_path ?? '';
    if (this.product?.images) {
      const idx = this.product.images.findIndex((i) => i.image_path === img.image_path);
      if (idx >= 0) this.currentImageIndex = idx;
    }
  }

  prevImage() {
    if (!this.product?.images?.length) return;
    const len = this.product.images.length;
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len;
    this.selectedImage = this.product.images[this.currentImageIndex].image_path ?? '';
  }

  nextImage() {
    if (!this.product?.images?.length) return;
    const len = this.product.images.length;
    this.currentImageIndex = (this.currentImageIndex + 1) % len;
    this.selectedImage = this.product.images[this.currentImageIndex].image_path ?? '';
  }

  /** Magnifier zoom — moves transform-origin based on cursor position */
  onImageHover(event: MouseEvent) {
    if (window.innerWidth < 640) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin = `${x}% ${y}%`;
    this.isZooming = true;
  }

  onImageLeave() {
    this.isZooming = false;
    this.zoomOrigin = 'center center';
  }

  // ══════════════════════════════════════════
  // Variants
  // ══════════════════════════════════════════

updateVariant() {
  if (!this.variants.length) return;

  const found = this.variants.find((v) =>
    Object.keys(this.selectedAttributes).some(
      (attrKey) => v.attributes?.[attrKey]?.value === this.selectedAttributes[attrKey]
    )
  );
  this.selectedVariant = found;
}

  selectAttribute(attrKey: string, value: string) {
    this.selectedAttributes[attrKey] = value;
    this.updateVariant();
    this.cdr.detectChanges();
  }

  hasAttributes(): boolean {
    return Object.keys(this.grouped_attributes).filter((k) => k !== 'default').length > 0;
  }

  get visibleAttributes(): Record<
    string,
    { attribute_id: number; values: { attribute_value_id: number; value: string }[] }
  > {
    const result: typeof this.grouped_attributes = {};
    Object.keys(this.grouped_attributes).forEach((key) => {
      if (key !== 'default') result[key] = this.grouped_attributes[key];
    });
    return result;
  }

  // ══════════════════════════════════════════
  // Pricing & Discounts
  // ══════════════════════════════════════════

  getDisplayPrice(): number {
    if (!this.product) return 0;
    return this.categoriesService.getDisplayPrice(this.product);
  }

getOriginalPrice(): number {
  if (!this.product) return 0;
  return this.parsePrice(this.product.price);
}


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

  /** True if there's a discount (offer or net_price < price) */
  hasDiscount(): boolean {
    if (!this.product) return false;

    // Check via offers
    if (this.product.offers?.length && !this.product.offers[0].is_expired) {
      return true;
    }

    // Check via price difference
    const original = parseFloat(String(this.product.price ?? 0));
    const current = this.getDisplayPrice();
    return original > 0 && current > 0 && original > current;
  }

  /** Discount percentage as integer */
  discountPercent(): number {
    if (!this.product) return 0;

    if (this.product.offers?.length && !this.product.offers[0].is_expired) {
      return Math.round(this.product.offers[0].discount_percent || 0);
    }

    const original = this.getOriginalPrice();
    const current = this.getDisplayPrice();
    if (original > 0 && current > 0 && original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return 0;
  }

  /** Savings amount in currency */
  getSavings(): number {
    const original = this.getOriginalPrice();
    const current = this.getDisplayPrice();
    return Math.max(0, original - current);
  }

  // ══════════════════════════════════════════
  // Product Info
  // ══════════════════════════════════════════

  getProductName(): string {
    if (!this.product) return '';
    return this.categoriesService.getProductDisplayName(this.product);
  }

  getMonthlyPayment(): number {
    if (!this.product || !this.selectedMonths) return 0;
    return Math.ceil(this.getDisplayPrice() / this.selectedMonths);
  }

  // ══════════════════════════════════════════
  // Quantity
  // ══════════════════════════════════════════

  increaseQuantity() {
    this.quantity++;
  }
  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }

canAddToCart(): boolean {
  if (!this.product) return false;
  if (!this.variants.length) return this.product.stock > 0;
  if (!this.selectedVariant) return this.product.stock > 0;
  return this.selectedVariant.stock > 0;
}
  // ══════════════════════════════════════════
  // Shipping
  // ══════════════════════════════════════════

  get shippingCost(): number {
    return parseFloat(this.siteSettingService.setting?.shipping_data?.shipping_cost || '0');
  }

  get freeShippingMin(): number {
    return parseFloat(this.siteSettingService.setting?.shipping_data?.free_shipping_min || '0');
  }

  get hasFreeShipping(): boolean {
    return (
      this.freeShippingMin > 0 && this.getDisplayPrice() * this.quantity >= this.freeShippingMin
    );
  }

  goBack() {
    window.history.back();
  }

  // ══════════════════════════════════════════
  // Cart
  // ══════════════════════════════════════════

  addToCart() {
    if (!this.product || this.isAddingToCart) return;

    if (!this.canAddToCart()) {
      this.toastr.error('❌ المنتج غير متوفر أو لم يتم اختيار المواصفات');
      return;
    }

    if (this.selectedVariant && this.selectedVariant.stock < this.quantity) {
      this.toastr.error(`الكمية المطلوبة غير متوفرة. المتوفر: ${this.selectedVariant.stock}`);
      return;
    }

    this.isAddingToCart = true;

    this.cartService
      .addToCart(
        this.product.id,
        this.quantity,
        this.selectedVariant?.variant_id,
        this.product as any,
        this.selectedVariant,
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.toastr.success('تم إضافة المنتج للسلة ✅');
            this.isAddingToCart = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error(err);
            this.toastr.error('حدث خطأ أثناء الإضافة');
            this.isAddingToCart = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  // ══════════════════════════════════════════
  // Share
  // ══════════════════════════════════════════

  /** Copy current page URL to clipboard with feedback */
  copyLink(): void {
    const url = window.location.href;

    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
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
      navigator.clipboard.writeText(url).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    this.linkCopied = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.linkCopied = false;
        this.cdr.detectChanges();
      });
    }, 2000);
  }

  /** Build WhatsApp share URL with product name + page URL */
  getWhatsappShareUrl(): string {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`شاهد هذا المنتج: ${this.getProductName()}`);
    return `https://wa.me/?text=${text}%20${url}`;
  }

  // ══════════════════════════════════════════
  // Misc
  // ══════════════════════════════════════════

  currencySymbol(): string {
    return this.siteSettingService.getCurrencySymbol();
  }
}
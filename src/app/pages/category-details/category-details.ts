import { Component, OnInit, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  CategoriesService,
  ClassCategory,
  Mark,
  MarkWithProducts,
  CategoryProduct,
} from '../../core/services/categories.service';

import { SearchService } from '../../core/services/search';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { Pagination } from '../../shared/components/pagination/pagination';
import { CartService } from '../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { SiteSettingService } from '../../core/services/site-setting.service';
import { WishlistButton } from '../../shared/components/wishlist-button/wishlist-button';
import { QuickViewButton } from '../../shared/components/quick-view-button/quick-view-button';
import { BackButton } from '../../shared/components/back-button/back-button';
import { PriceFormatPipe } from '../../shared/components/pipes/price-format.pipe';


type ViewMode = 'marks' | 'products';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, PriceFormatPipe, HeroSection, RouterModule, Pagination, FormsModule, WishlistButton, QuickViewButton, BackButton],
  templateUrl: './category-details.html',
  styleUrl: './category-details.css',
})
export class CategoryDetails implements OnInit {

  viewMode: ViewMode = 'marks';
  isLoading = true;
  isAddingToCart = false;

  currentClass?: ClassCategory;
  currentMark?: Mark;

  marksWithProducts: MarkWithProducts[] = [];
  products: CategoryProduct[] = [];

  searchQuery = '';
  isSearching = false;
  searchedMarks: MarkWithProducts[] = [];
  searchedProducts: CategoryProduct[] = [];
  hasSearched = false;

  minPrice = 0;
  maxPrice = 0;
  isFilterOpen = false;

  currentPageMarks = 1;
  itemsPerPageMarks = 8;
  currentPageProducts = 1;
  itemsPerPageProducts = 8;

  private readonly toastr = inject(ToastrService);
  private readonly siteSettingService = inject(SiteSettingService);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private categoriesService: CategoriesService,
    private cartService: CartService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    const perPage = this.siteSettingService.setting?.all_settings?.products_per_page;
    if (perPage) {
      this.itemsPerPageProducts = perPage;
    }

    this.route.params.subscribe(params => {
      const classId = Number(params['classId']);
      const markId  = Number(params['markId']);
      window.scrollTo(0, 0);

      if (classId && markId) {
        this.viewMode = 'products';
        this.loadProducts(classId, markId);
      } else if (classId) {
        this.viewMode = 'marks';
        this.loadMarks(classId);
      } else {
        this.router.navigate(['/categories']);
      }
    });
  }

  getHeroDescription(): string {
    if (this.viewMode === 'products') {
      const count = this.displayProducts.length;
      if (count === 0) return 'استكشف منتجات هذه الماركة';
      return `استكشف ${count} منتج متاح في هذه الماركة`;
    }
    const count = this.displayMarks.length;
    if (count === 0) return 'تصفح الماركات المتاحة في هذا الصنف';
    return `تصفح ${count} ماركة متاحة في هذا الصنف`;
  }

  get hasActiveFilters(): boolean {
    return this.minPrice > 0 || (this.maxPrice > 0 && this.maxPrice < this.getMaxProductPrice());
  }

  private getMaxProductPrice(): number {
    const prices = this.products.map(p => this.categoriesService.getDisplayPrice(p));
    return prices.length ? Math.max(...prices) : 0;
  }

  clearAll() {
    this.searchQuery = '';
    this.hasSearched = false;
    this.searchedMarks = [];
    this.searchedProducts = [];
    this.minPrice = 0;
    this.maxPrice = this.getMaxProductPrice();
    this.currentPageMarks = 1;
    this.currentPageProducts = 1;
    this.cdr.detectChanges();
  }

<<<<<<< HEAD
=======
  get showOutOfStock(): boolean {
    return this.siteSettingService.setting?.all_settings?.show_out_of_stock ?? true;
  }

>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
  loadMarks(classId: number) {
    this.isLoading = true;
    this.resetState();

    this.categoriesService.getAllClasses().subscribe(classes => {
      this.ngZone.run(() => {
        this.currentClass = classes.find(c => c.id === classId);
        this.cdr.detectChanges();
      });
    });

    this.categoriesService.getMarksByClass(classId).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.marksWithProducts = data ?? [];
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.toastr.error('حدث خطأ أثناء تحميل الماركات');
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadProducts(classId: number, markId: number) {
    this.isLoading = true;
    this.resetState();

    this.categoriesService.getClassesWithMarks().subscribe((classes) => {
      this.currentClass = classes.find((c) => c.class.id === classId)?.class;
    });

    this.categoriesService.getMarksByClass(classId).subscribe({
      next: (data) => {
<<<<<<< HEAD
              console.log('data:', data); // ← هنا

=======
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
        this.ngZone.run(() => {
          const found = data.find((m) => m.mark.id === markId);

          if (found) {
            this.currentMark = found.mark;

            const allProducts = found.products ?? [];

            this.products = allProducts.map(p => ({
              id: p.id,
              name: p.name,
              model: p.model,
              description: p.description,
              price: String(p.price ?? 0),
              net_price: String(p.net_price ?? 0),
<<<<<<< HEAD
              // [تعديل] المخزون ثابت 10000 دايمًا — لا نعتمد على قيمة المخزون من الـ API
              stock: 10000,
=======
              stock: p.stock ?? 0,
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
              cover_image: p.cover_image ?? null,

              mark_name: '',
              class_name: '',
              company_name: '',

              images: p.cover_image
                ? [{ id: 0, product_id: p.id, image_path: p.cover_image }]
                : [],

              video: p.video ?? null,
              offers: [],
              is_new: !!p.is_new,
              is_new_product: !!p.is_new_product,

              installment_plans: [],
              currency: ''
            }));

            const prices = this.products.map(p =>
              this.categoriesService.getDisplayPrice(p)
            );

            this.maxPrice = prices.length ? Math.max(...prices) : 0;
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.toastr.error('حدث خطأ');
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;

    if (!query.trim()) {
      this.hasSearched = false;
      this.searchedMarks = [];
      this.searchedProducts = [];
      this.currentPageMarks = 1;
      this.currentPageProducts = 1;
      this.cdr.detectChanges();
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    this.searchService.search(query).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          if (this.viewMode === 'marks') {
            const markResults: any[] = res.marks ?? [];
            const markIds = new Set(markResults.map((m: any) => m.id));
            this.searchedMarks = this.marksWithProducts.filter(m => markIds.has(m.mark.id));

            if (this.searchedMarks.length === 0) {
              this.searchedMarks = this.marksWithProducts.filter(m =>
                m.mark.name.toLowerCase().includes(query.toLowerCase())
              );
            }
          } else {
            const lowerQuery = query.toLowerCase();
            this.searchedProducts = this.products.filter(p =>
              this.categoriesService.getProductDisplayName(p).toLowerCase().includes(lowerQuery) ||
              (p.model && p.model.toLowerCase().includes(lowerQuery))
            );
          }

          this.isSearching = false;
          this.currentPageMarks = 1;
          this.currentPageProducts = 1;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isSearching = false;
          this.toastr.error('حدث خطأ في البحث');
          this.cdr.detectChanges();
        });
      }
    });
  }

  get displayMarks(): MarkWithProducts[] {
    return this.hasSearched ? this.searchedMarks : this.marksWithProducts;
  }

  get displayProducts(): CategoryProduct[] {
<<<<<<< HEAD
    // [تعديل] حذف فلتر showOutOfStock — المخزون دايمًا متوفر ولا نخفي أي منتج
    const source = this.hasSearched ? this.searchedProducts : this.products;
=======
    let source = this.hasSearched ? this.searchedProducts : this.products;

    if (!this.showOutOfStock) {
      source = source.filter(p => p.stock > 0);
    }
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a

    if (!this.minPrice && !this.maxPrice) return source;

    return source.filter(p => {
      const price = this.categoriesService.getDisplayPrice(p);
      const aboveMin = !this.minPrice || price >= this.minPrice;
      const belowMax = !this.maxPrice || price <= this.maxPrice;
      return aboveMin && belowMax;
    });
  }

  get paginatedMarks(): MarkWithProducts[] {
    const start = (this.currentPageMarks - 1) * this.itemsPerPageMarks;
    return this.displayMarks.slice(start, start + this.itemsPerPageMarks);
  }

  get totalPagesMarks(): number {
    return Math.ceil(this.displayMarks.length / this.itemsPerPageMarks);
  }

  get paginatedProducts(): CategoryProduct[] {
    const start = (this.currentPageProducts - 1) * this.itemsPerPageProducts;
    return this.displayProducts.slice(start, start + this.itemsPerPageProducts);
  }

  get totalPagesProducts(): number {
    return Math.ceil(this.displayProducts.length / this.itemsPerPageProducts);
  }

  onPageChangeMarks(page: number) {
    this.currentPageMarks = page;
    window.scrollTo(0, 0);
  }

  onPageChangeProducts(page: number) {
    this.currentPageProducts = page;
    window.scrollTo(0, 0);
  }

  toggleFilter() { this.isFilterOpen = !this.isFilterOpen; }

  applyFilter() {
    this.currentPageProducts = 1;
    this.isFilterOpen = false;
    this.cdr.detectChanges();
  }

  resetFilter() {
    this.minPrice = 0;
    this.maxPrice = this.getMaxProductPrice();
    this.currentPageProducts = 1;
    this.cdr.detectChanges();
  }

  goToMark(classId: number, markId: number) {
    this.router.navigate(['/category-details', classId, 'mark', markId]);
  }

  goToProductDetails(productId: number) {
    this.router.navigate(['/product', productId]);
  }
<<<<<<< HEAD
  addToCart(product: CategoryProduct) {
    if (!product || this.isAddingToCart) return;

    this.isAddingToCart = true;

    this.cartService.addToCart(
      product.id, 
      1, 
      product as any          // ← الباراميتر الثالث هو الـ product
    ).subscribe({
=======

  addToCart(product: CategoryProduct) {
    if (!product || product.stock === 0 || this.isAddingToCart) return;
    this.isAddingToCart = true;

    this.cartService.addToCart(product.id, 1, undefined, product as any).subscribe({
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
      next: () => {
        this.ngZone.run(() => {
          this.toastr.success('تم إضافة المنتج للسلة ✅');
          this.isAddingToCart = false;
          this.cdr.detectChanges();
        });
      },
<<<<<<< HEAD
      error: (err) => {
        this.ngZone.run(() => {
          console.error(err);
          this.toastr.error(err.error?.message || 'حدث خطأ أثناء الإضافة');
=======
      error: () => {
        this.ngZone.run(() => {
          this.toastr.error('حدث خطأ أثناء الإضافة');
>>>>>>> 0c864542b9495e03a0372b5f12da8982cbee726a
          this.isAddingToCart = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getProductName(product: CategoryProduct): string {
    return this.categoriesService.getProductDisplayName(product);
  }

  getDisplayPrice(product: CategoryProduct): number {
    return this.categoriesService.getDisplayPrice(product);
  }

  getProductImage(product: CategoryProduct): string {
    return product?.images?.[0]?.image_path || product?.cover_image || '';
  }

  currencySymbol(): string {
    return this.siteSettingService.getCurrencySymbol();
  }

  private resetState() {
    this.marksWithProducts = [];
    this.products = [];
    this.searchedMarks = [];
    this.searchedProducts = [];
    this.hasSearched = false;
    this.searchQuery = '';
    this.currentPageMarks = 1;
    this.currentPageProducts = 1;
    this.minPrice = 0;
    this.maxPrice = 0;
    this.isFilterOpen = false;
    this.currentClass = undefined;
    this.currentMark = undefined;
  }
}
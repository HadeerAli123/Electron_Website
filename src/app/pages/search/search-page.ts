import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SearchService, SearchResult } from '../../core/services/search';
import { SearchStorageService } from '../../core/services/search-storage.service';
import { CategoriesService } from '../../core/services/categories.service';
import { QuickViewButton } from '../../shared/components/quick-view-button/quick-view-button';
import { BackButton } from '../../shared/components/back-button/back-button';

type FilterTab = 'all' | 'products' | 'classes' | 'marks';

interface ProductLite {
  id: number;
  name?: string | null;
  model?: string | null;
  cover_image?: string | null;
  price?: number | string;
  net_price?: number | string;
  mark_name?: string;
  class_name?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterLink, QuickViewButton, BackButton],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class SearchPage implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private storage = inject(SearchStorageService);
  private categoriesService = inject(CategoriesService);
  private destroy$ = new Subject<void>();

  /** Cache: markId → classId mapping */
  private markToClassMap = new Map<number, number>();
  private isMarkMapLoaded = false;

  // ─── State ──────────────────────────────────
  query = signal('');
  isLoading = signal(false);
  results = signal<SearchResult | null>(null);
  activeTab = signal<FilterTab>('all');
  sortBy = signal<'default' | 'price-asc' | 'price-desc'>('default');

  // ─── Computed ──────────────────────────────────
  totalResults = computed(() => {
    const r = this.results();
    if (!r) return 0;
    return (r.meta?.products_total ?? 0)
         + (r.meta?.classes_total ?? 0)
         + (r.meta?.marks_total ?? 0);
  });

  productsCount  = computed(() => this.results()?.meta?.products_total ?? 0);
  classesCount   = computed(() => this.results()?.meta?.classes_total ?? 0);
  marksCount     = computed(() => this.results()?.meta?.marks_total ?? 0);

  /** Sorted products based on sortBy signal */
  sortedProducts = computed<ProductLite[]>(() => {
    const products = this.results()?.products ?? [];
    const sort = this.sortBy();
    if (sort === 'default') return products;
    const sorted = [...products];
    sorted.sort((a, b) => {
      const pa = this.getPrice(a);
      const pb = this.getPrice(b);
      return sort === 'price-asc' ? pa - pb : pb - pa;
    });
    return sorted;
  });

  // ─── Lifecycle ──────────────────────────────────
  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const q = (params['q'] ?? '').toString().trim();
        if (q && q !== this.query()) {
          this.query.set(q);
          this.runSearch(q);
        } else if (!q) {
          this.results.set(null);
          this.query.set('');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Search ──────────────────────────────────
  private runSearch(q: string): void {
    this.isLoading.set(true);
    this.storage.addRecent(q);
    this.searchService.search(q, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.results.set(r);
          this.isLoading.set(false);
          this.activeTab.set('all');
          // Scroll up
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        error: () => this.isLoading.set(false),
      });
  }

  /** Submit a new search from the page input */
  onSubmit(event: Event): void {
    event.preventDefault();
    const q = this.query().trim();
    if (q.length < 2) return;
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearQuery(): void {
    this.query.set('');
  }

  // ─── Filters ──────────────────────────────────
  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  setSort(sort: 'default' | 'price-asc' | 'price-desc'): void {
    this.sortBy.set(sort);
  }

  // ─── Navigation ──────────────────────────────────
  goToProduct(p: ProductLite): void {
    this.router.navigate(['/product', p.id]);
  }

  goToClass(c: any): void {
    this.router.navigate(['/category-details', c.id]);
  }

  goToMark(m: any): void {
    const directClassId = m.class_id || m.classId;
    if (directClassId) {
      this.router.navigate(['/category-details', directClassId, 'mark', m.id]);
      return;
    }
    // Lookup from categories service
    this.lookupClassIdForMark(m.id).then(classId => {
      if (classId) {
        this.router.navigate(['/category-details', classId, 'mark', m.id]);
      } else {
        this.router.navigate(['/categories']);
      }
    });
  }

  /** Build & cache markId → classId map */
  private async lookupClassIdForMark(markId: number): Promise<number | null> {
    if (!this.isMarkMapLoaded) {
      try {
        const classes = await new Promise<any[]>((resolve, reject) => {
          this.categoriesService.getClassesWithMarks().subscribe({
            next: data => resolve(data ?? []),
            error: err => reject(err)
          });
        });
        for (const cls of classes) {
          const classId = cls.class?.id;
          const marks = cls.marks ?? [];
          for (const mark of marks) {
            if (mark.id && classId) {
              this.markToClassMap.set(mark.id, classId);
            }
          }
        }
        this.isMarkMapLoaded = true;
      } catch {
        return null;
      }
    }
    return this.markToClassMap.get(markId) ?? null;
  }

  // ─── Helpers ──────────────────────────────────
  getProductName(p: ProductLite): string {
    return (p.name?.trim() || p.model || 'منتج').toString();
  }

  getPrice(p: ProductLite): number {
    const net = +(p.net_price || 0);
    return net > 0 ? net : +(p.price || 0);
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? url : '/' + url;
  }

  /** Get name from a class/mark — handles name_ar, name, name_en */
  getEntityName(entity: any): string {
    if (!entity) return '';
    return (entity.name_ar?.trim() ||
            entity.name?.trim() ||
            entity.name_en?.trim() ||
            'بدون اسم').toString();
  }

  /** Get image from a class/mark — handles image, img, photo */
  getEntityImage(entity: any): string | null {
    if (!entity) return null;
    const img = entity.image || entity.img || entity.photo || null;
    if (!img || (typeof img === 'string' && img.trim() === '')) return null;
    return img;
  }

  /** First letter for fallback when image missing */
  getEntityInitial(entity: any): string {
    return this.getEntityName(entity).charAt(0).toUpperCase();
  }

  /** Highlight matches in text */
  highlightMatch(text: string | null | undefined): string {
    const safe = (text || '').toString();
    const q = this.query().trim();
    if (!q || q.length < 2) return this.escapeHtml(safe);
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return this.escapeHtml(safe).replace(
        regex,
        '<mark class="sp-highlight">$1</mark>'
      );
    } catch {
      return this.escapeHtml(safe);
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Skeleton helpers
  readonly skeletonArray = Array(8);
}
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Output,
  signal,
  ViewChild,
  computed,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';

import { SearchService, SearchResult } from '../../../core/services/search';
import { SearchStorageService } from '../../../core/services/search-storage.service';
import { VoiceSearchService } from '../../../core/services/voice-search.service';
import { CategoriesService } from '../../../core/services/categories.service';

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

interface ClassLite { id: number; name: string; image?: string | null; }
interface MarkLite  { id: number; name: string; image?: string | null; }

type FocusableType = 'product' | 'class' | 'mark' | 'recent' | 'trending';
interface FocusableItem {
  type: FocusableType;
  index: number;
  data: any;
}

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.css',
})
export class SearchModal implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  private searchService = inject(SearchService);
  private storage = inject(SearchStorageService);
  private voice = inject(VoiceSearchService);
  private router = inject(Router);
  private categoriesService = inject(CategoriesService);
  private destroy$ = new Subject<void>();
  private query$ = new Subject<string>();

  /** Cache: markId → classId mapping built once when needed */
  private markToClassMap = new Map<number, number>();
  private isMarkMapLoaded = false;

  // ─── State ──────────────────────────────────────
  query = signal('');
  isLoading = signal(false);
  hasSearched = signal(false);
  results = signal<SearchResult | null>(null);
  focusedIndex = signal(-1);

  // Voice
  isListening = this.voice.isListening;
  isVoiceSupported = this.voice.isSupported;

  // Storage
  recentSearches = this.storage.recentSearches;

  // ─── Computed ──────────────────────────────────────

  /** Total result count */
  totalResults = computed(() => {
    const r = this.results();
    if (!r) return 0;
    return (r.meta?.products_total ?? 0)
         + (r.meta?.classes_total ?? 0)
         + (r.meta?.marks_total ?? 0);
  });

  trending = computed(() => {
    const r = this.results();
    if (r?.popular_searches?.length) return r.popular_searches;
    return ['كوفي ميكر', 'سامسونج', 'ايفون', 'تابلت', 'سماعات'];
  });

  /** Smart suggestions when no results found */
  smartSuggestions = computed(() => {
    const q = this.query().trim();
    if (!q || q.length < 2) return [];
    // Generate suggestions by trimming the query
    const suggestions = new Set<string>();
    if (q.length > 3) suggestions.add(q.slice(0, -1));
    if (q.length > 4) suggestions.add(q.slice(0, -2));
    // Add first word only
    const firstWord = q.split(' ')[0];
    if (firstWord && firstWord.length >= 2 && firstWord !== q) {
      suggestions.add(firstWord);
    }
    return Array.from(suggestions).slice(0, 3);
  });

  /** Flat list of focusable items for keyboard navigation */
  focusableItems = computed<FocusableItem[]>(() => {
    const list: FocusableItem[] = [];
    const r = this.results();
    const q = this.query().trim();

    if (q.length >= 2 && r) {
      r.products?.slice(0, 5).forEach((data, index) =>
        list.push({ type: 'product', index, data })
      );
      r.classes?.slice(0, 3).forEach((data, index) =>
        list.push({ type: 'class', index, data })
      );
      r.marks?.slice(0, 3).forEach((data, index) =>
        list.push({ type: 'mark', index, data })
      );
    } else {
      // Empty state — recent + trending are focusable
      this.recentSearches().forEach((data, index) =>
        list.push({ type: 'recent', index, data })
      );
      this.trending().forEach((data, index) =>
        list.push({ type: 'trending', index, data })
      );
    }
    return list;
  });

  // ─── Lifecycle ──────────────────────────────────────
  ngAfterViewInit(): void {
    this.setupSearchPipeline();
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.voice.stop();
    document.body.style.overflow = '';
  }

  private setupSearchPipeline(): void {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(q => {
          const trimmed = q.trim();
          if (trimmed.length < 2) {
            this.isLoading.set(false);
            this.hasSearched.set(false);
            this.results.set(null);
            return of(null);
          }
          this.isLoading.set(true);
          return this.searchService.search(trimmed, 10);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          this.isLoading.set(false);
          if (r) {
            this.hasSearched.set(true);
            this.results.set(r);
            this.focusedIndex.set(-1);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.hasSearched.set(true);
        }
      });
  }

  // ─── Input ──────────────────────────────────────
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.query$.next(value);
  }

  clearQuery(): void {
    this.query.set('');
    this.query$.next('');
    this.results.set(null);
    this.hasSearched.set(false);
    this.searchInputRef?.nativeElement.focus();
  }

  // ─── Voice ──────────────────────────────────────
  async onVoiceClick(): Promise<void> {
    if (this.isListening()) {
      this.voice.stop();
      return;
    }
    try {
      const transcript = await this.voice.start('ar-SA');
      if (transcript) {
        this.query.set(transcript);
        this.query$.next(transcript);
        if (this.searchInputRef) {
          this.searchInputRef.nativeElement.value = transcript;
        }
      }
    } catch {
      /* error already shown via signal */
    }
  }

  // ─── Selection / Navigation ──────────────────────────────────────
  selectQuery(query: string): void {
    this.query.set(query);
    this.query$.next(query);
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.value = query;
      this.searchInputRef.nativeElement.focus();
    }
  }

  goToProduct(p: ProductLite): void {
    this.storage.addRecent(this.query() || (p.name || p.model || ''));
    this.router.navigate(['/product', p.id]);
    this.close.emit();
  }

  goToClass(c: any): void {
    this.storage.addRecent(this.query() || this.getEntityName(c));
    this.router.navigate(['/category-details', c.id]);
    this.close.emit();
  }

  goToMark(m: any): void {
    this.storage.addRecent(this.query() || this.getEntityName(m));

    // Try to get class_id from the mark object directly
    const directClassId = m.class_id || m.classId;

    if (directClassId) {
      this.router.navigate(['/category-details', directClassId, 'mark', m.id]);
      this.close.emit();
      return;
    }

    // Fallback: lookup the class_id from CategoriesService
    this.lookupClassIdForMark(m.id).then(classId => {
      if (classId) {
        this.router.navigate(['/category-details', classId, 'mark', m.id]);
      } else {
        // Final fallback — go to all categories
        this.router.navigate(['/categories']);
      }
      this.close.emit();
    });
  }

  /** Build a markId → classId map from getClassesWithMarks(), cached */
  private async lookupClassIdForMark(markId: number): Promise<number | null> {
    if (!this.isMarkMapLoaded) {
      try {
        const classes = await new Promise<any[]>((resolve, reject) => {
          this.categoriesService.getClassesWithMarks().subscribe({
            next: data => resolve(data ?? []),
            error: err => reject(err)
          });
        });
        // Build the map: each mark inside each class
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

  viewAllResults(): void {
    const q = this.query().trim();
    if (!q) return;
    this.storage.addRecent(q);
    this.router.navigate(['/search'], { queryParams: { q } });
    this.close.emit();
  }

  // ─── Recent searches ──────────────────────────────────────
  removeRecent(event: Event, query: string): void {
    event.stopPropagation();
    this.storage.removeRecent(query);
  }

  clearAllRecent(): void {
    this.storage.clearAll();
  }

  // ─── Keyboard navigation ──────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }

    const items = this.focusableItems();
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex.set(
        Math.min(this.focusedIndex() + 1, items.length - 1)
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex.set(
        Math.max(this.focusedIndex() - 1, -1)
      );
    } else if (event.key === 'Enter') {
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < items.length) {
        event.preventDefault();
        const item = items[idx];
        if (item.type === 'product') this.goToProduct(item.data);
        else if (item.type === 'class') this.goToClass(item.data);
        else if (item.type === 'mark') this.goToMark(item.data);
        else if (item.type === 'recent' || item.type === 'trending') {
          this.selectQuery(item.data);
        }
      } else if (this.query().trim().length >= 2) {
        // No focus — submit the query
        this.viewAllResults();
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────
  isFocused(type: FocusableType, index: number): boolean {
    const items = this.focusableItems();
    const focusIdx = this.focusedIndex();
    if (focusIdx < 0 || focusIdx >= items.length) return false;
    const focused = items[focusIdx];
    return focused.type === type && focused.index === index;
  }

  /** Highlight matching parts of text */
  highlightMatch(text: string | null | undefined): string {
    const safe = (text || '').toString();
    const q = this.query().trim();
    if (!q || q.length < 2) return this.escapeHtml(safe);
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return this.escapeHtml(safe).replace(
        regex,
        '<mark class="sm-highlight">$1</mark>'
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

  /** Get product display price */
  getPrice(p: ProductLite): number {
    const net = +(p.net_price || 0);
    return net > 0 ? net : +(p.price || 0);
  }

  /** Get product display name */
  getProductName(p: ProductLite): string {
    return (p.name?.trim() || p.model || 'منتج').toString();
  }

  /** Image URL with fallback handling */
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

  /** Get first letter of entity name (for fallback when no image) */
  getEntityInitial(entity: any): string {
    const name = this.getEntityName(entity);
    return name.charAt(0).toUpperCase();
  }

  // ─── Backdrop click ──────────────────────────────────────
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
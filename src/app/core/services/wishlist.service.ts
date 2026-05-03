import { Injectable, signal, computed, effect } from '@angular/core';

const STORAGE_KEY = 'electron_wishlist';

export interface WishlistItem {
  id: number;
  name: string;
  model?: string | null;
  cover_image?: string | null;
  price: number;
  net_price?: number;
  mark_name?: string;
  class_name?: string;
  mark_id?: number;
  class_id?: number;
  stock?: number;
  added_at: number; // timestamp for sorting
}

@Injectable({ providedIn: 'root' })
export class WishlistService {

  private readonly items = signal<WishlistItem[]>(this.loadFromStorage());

  readonly wishlist = this.items.asReadonly();

  readonly count = computed(() => this.items().length);

  readonly idSet = computed(() => new Set(this.items().map(i => i.id)));

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
      } catch {
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue !== null) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              this.items.set(parsed);
            }
          } catch { /* ignore */ }
        }
      });
    }
  }

  isInWishlist(productId: number): boolean {
    return this.idSet().has(productId);
  }

  
  add(product: any): boolean {
    if (!product?.id) return false;
    if (this.isInWishlist(product.id)) return false;

    const item: WishlistItem = {
      id: +product.id,
      name: this.extractName(product),
      model: product.model ?? null,
      cover_image: product.cover_image ?? product.image ?? null,
      price: +(product.price ?? 0),
      net_price: +(product.net_price ?? 0),
      mark_name: product.mark_name ?? product.mark?.name_ar ?? product.mark?.name ?? '',
      class_name: product.class_name ?? product.class?.name_ar ?? product.class?.name ?? '',
      mark_id: product.mark_id ?? product.mark?.id,
      class_id: product.class_id ?? product.class?.id,
      stock: product.stock ?? 0,
      added_at: Date.now(),
    };

    this.items.update(list => [item, ...list]);
    return true;
  }

  /** Remove a product by id */
  remove(productId: number): boolean {
    if (!this.isInWishlist(productId)) return false;
    this.items.update(list => list.filter(i => i.id !== productId));
    return true;
  }

  toggle(product: any): boolean {
    if (this.isInWishlist(product.id)) {
      this.remove(product.id);
      return false;
    }
    return this.add(product);
  }

  /** Clear everything */
  clearAll(): void {
    this.items.set([]);
  }

  getItem(productId: number): WishlistItem | undefined {
    return this.items().find(i => i.id === productId);
  }

  // ─── Private ──────────────────────────────────
  private loadFromStorage(): WishlistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private extractName(product: any): string {
    return (product.name?.trim() ||
            product.name_ar?.trim() ||
            product.name_en?.trim() ||
            product.model?.trim() ||
            'منتج').toString();
  }
}
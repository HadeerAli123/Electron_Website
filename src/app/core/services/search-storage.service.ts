import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'electron_recent_searches';
const MAX_RECENT = 5;

@Injectable({ providedIn: 'root' })
export class SearchStorageService {

  readonly recentSearches = signal<string[]>(this.loadFromStorage());

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recentSearches()));
      } catch {
        /* localStorage might be disabled */
      }
    });
  }

  addRecent(query: string): void {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    const current = this.recentSearches();
    // Remove duplicate (case-insensitive)
    const filtered = current.filter(
      q => q.toLowerCase() !== trimmed.toLowerCase()
    );
    // Add to top + cap at MAX_RECENT
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
    this.recentSearches.set(updated);
  }

  removeRecent(query: string): void {
    this.recentSearches.update(list =>
      list.filter(q => q !== query)
    );
  }

  clearAll(): void {
    this.recentSearches.set([]);
  }

  private loadFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  }
}
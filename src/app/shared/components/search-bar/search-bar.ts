import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchModal } from '../search-modal/search-modal';

/**
 * Search trigger button — clickable bar in the navbar.
 * Clicking opens the full SearchModal.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, SearchModal],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  // Open with Cmd/Ctrl+K shortcut
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.open();
        }
      });
    }
  }
}
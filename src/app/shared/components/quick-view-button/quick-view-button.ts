import { Component, Input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickViewModal } from '../quick-view-modal/quick-view-modal';

/**
 * Quick View trigger button.
 * Place on product cards as an overlay — opens the QuickViewModal.
 *
 * Usage:
 *   <app-quick-view-button [product]="product" variant="overlay"></app-quick-view-button>
 *   <app-quick-view-button [product]="product" variant="inline"></app-quick-view-button>
 */
@Component({
  selector: 'app-quick-view-button',
  standalone: true,
  imports: [CommonModule, QuickViewModal],
  templateUrl: './quick-view-button.html',
  styleUrl: './quick-view-button.css',
})
export class QuickViewButton {
  @Input({ required: true }) product!: any;
  @Input() variant: 'overlay' | 'inline' = 'overlay';

  isOpen = signal(false);

  open(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
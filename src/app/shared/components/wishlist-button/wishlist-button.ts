import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { WishlistService } from '../../../core/services/wishlist.service';

export type WishlistButtonVariant = 'icon' | 'full' | 'circle';
export type WishlistButtonSize = 'sm' | 'md' | 'lg';


@Component({
  selector: 'app-wishlist-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist-button.html',
  styleUrl: './wishlist-button.css',
})
export class WishlistButton {
  @Input({ required: true }) product!: any;
  @Input() variant: WishlistButtonVariant = 'circle';
  @Input() size: WishlistButtonSize = 'md';

  @Input() showToast: boolean = true;

  private wishlist = inject(WishlistService);
  private toastr = inject(ToastrService);

  isActive = computed(() => {
    if (!this.product?.id) return false;
    return this.wishlist.idSet().has(+this.product.id);
  });

  isAnimating = signal(false);

  onClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.product?.id) return;

    const wasAdded = this.wishlist.toggle(this.product);

    // Trigger animation
    this.isAnimating.set(true);
    setTimeout(() => this.isAnimating.set(false), 600);

    // Toast feedback
    if (this.showToast) {
      if (wasAdded) {
        this.toastr.success('تمت إضافة المنتج للمفضلة ❤️');
      } else {
        this.toastr.info('تم حذف المنتج من المفضلة');
      }
    }
  }
}
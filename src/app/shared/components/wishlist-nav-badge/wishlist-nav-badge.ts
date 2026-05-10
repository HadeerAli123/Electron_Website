import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';

/**
 * Wishlist nav badge — small heart icon with counter.
 * Place in navbar next to cart icon.
 */
@Component({
  selector: 'app-wishlist-nav-badge',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './wishlist-nav-badge.html',
  styleUrl: './wishlist-nav-badge.css',
})
export class WishlistNavBadge {
  private wishlist = inject(WishlistService);
  count = this.wishlist.count;
}
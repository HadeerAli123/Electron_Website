import { CommonModule } from '@angular/common';
import { Component, inject, HostListener, OnInit } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Phone, Menu, X } from 'lucide-angular';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { SiteSettingService } from '../../../core/services/site-setting.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.prod';
import { SearchBar } from '../search-bar/search-bar';
import { WishlistNavBadge } from '../wishlist-nav-badge/wishlist-nav-badge';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    SearchBar,
    WishlistNavBadge,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  readonly PhoneIcon = Phone;
  readonly MenuIcon = Menu;
  readonly XIcon = X;

  isMenuOpen = false;
  isDropdownOpen = false;

  cartService = inject(CartService);
  authService = inject(AuthService);
  private router = inject(Router);

  siteSettingService = inject(SiteSettingService);
  setting$ = this.siteSettingService.setting$;

  ngOnInit() {
    this.setting$.subscribe(setting => {
      if (setting?.all_settings?.favicon) {
        this.setFavicon(environment.apiUrl + '/' + setting.all_settings.favicon);
      }
    });
  }

  setFavicon(url: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = url;
  }

  readonly cartCount$: Observable<number> = combineLatest([
    this.cartService.cart$,
    this.cartService.guestCount$,
  ]).pipe(
    map(([cart, guestCount]) => {
      if (cart) {
        return cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      }
      return guestCount;
    })
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.isDropdownOpen = false;
    }
  }

  get currentUser() {
    return this.authService.getUser();
  }

  get userInitial(): string {
    const user = this.authService.getUser();
    return user?.name?.[0]?.toUpperCase() || '';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.authService.logout();
  }
}
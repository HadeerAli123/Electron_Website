import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SiteSettingService } from '../../../core/services/site-setting.service';
import { combineLatest, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

interface SocialLink {
  key: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'snapchat' | 'youtube';
  name: string;
  link: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css'
})
export class BottomNavComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private siteSettingService = inject(SiteSettingService);
  private router = inject(Router);

  isLoggedIn = false;
  userInitial = '';
  cartCount = 0;
  isMoreOpen = false;
  whatsappNumber: string | null = null;
  socialLinks: SocialLink[] = [];

  private subs: Subscription[] = [];

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    const user = (this.authService as any).getCurrentUser?.();
    if (user?.name_ar) {
      this.userInitial = user.name_ar.charAt(0);
    } else if (user?.name) {
      this.userInitial = user.name.charAt(0);
    }

    // Cart count
    this.subs.push(
      combineLatest([
        this.cartService.cart$,
        this.cartService.guestCount$,
      ]).pipe(
        map(([cart, guestCount]) => {
          if (cart) {
            return cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
          }
          return guestCount ?? 0;
        })
      ).subscribe(count => {
        this.cartCount = count;
      })
    );

    // WhatsApp + Social from settings
    this.subs.push(
      this.siteSettingService.setting$.subscribe((setting: any) => {
        this.whatsappNumber = setting?.whatsapp ?? null;
        this.socialLinks = this.buildSocialLinks(setting);
      })
    );

    // Close sheet on navigation
    this.subs.push(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe(() => {
        this.isMoreOpen = false;
        this.unlockBody();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.unlockBody();
  }

  toggleMoreMenu() {
    this.isMoreOpen = !this.isMoreOpen;
    if (this.isMoreOpen) {
      this.lockBody();
    } else {
      this.unlockBody();
    }
  }

  closeMoreMenu() {
    this.isMoreOpen = false;
    this.unlockBody();
  }

  // Close on Escape key
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isMoreOpen) {
      this.closeMoreMenu();
    }
  }

  private buildSocialLinks(setting: any): SocialLink[] {
    const social = setting?.social_data;
    if (!social) return [];

    const items: SocialLink[] = [
      { key: 'facebook',  name: 'فيسبوك',   link: social.facebook  },
      { key: 'instagram', name: 'انستجرام', link: social.instagram },
      { key: 'twitter',   name: 'تويتر',    link: social.twitter   },
      {
        key: 'whatsapp',
        name: 'واتساب',
        link: social.whatsapp ? `https://wa.me/${social.whatsapp}` : ''
      },
      { key: 'snapchat',  name: 'سناب شات', link: social.snapchat  },
      { key: 'youtube',   name: 'يوتيوب',   link: social.youtube   },
    ];

    return items.filter(item => !!item.link);
  }

  private lockBody() {
    document.body.style.overflow = 'hidden';
  }

  private unlockBody() {
    document.body.style.overflow = '';
  }
}
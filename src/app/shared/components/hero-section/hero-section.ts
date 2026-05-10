import { CommonModule } from '@angular/common';
import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export type HeroIcon = 'categories' | 'offers' | 'cart' | 'users' | 'phone' | 'info' | 'default';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection implements OnInit, OnDestroy {

  @Input() hero: string = '';

  @Input() title: string = '';

  @Input() description: string = '';

  @Input() image: string = '';

  @Input() icon?: HeroIcon;

  resolvedIcon: HeroIcon = 'default';

  private router = inject(Router);
  private routerSub?: Subscription;

  ngOnInit() {
    this.updateIcon();

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.updateIcon());
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updateIcon() {
    if (this.icon) {
      this.resolvedIcon = this.icon;
      return;
    }
    this.resolvedIcon = this.detectIconFromUrl(this.router.url);
  }

  /** Detect icon from URL path */
  private detectIconFromUrl(url: string): HeroIcon {
    const path = url.split('?')[0].split('#')[0].toLowerCase();

    if (path.includes('/offers'))                                return 'offers';
    if (path.includes('/category') || path.includes('/categories')) return 'categories';
    if (path.includes('/about'))                                 return 'info';
    if (path.includes('/contact'))                               return 'phone';
    if (path.includes('/broker'))                                return 'users';
    if (path.includes('/cart'))                                  return 'cart';

    return 'default';
  }
}
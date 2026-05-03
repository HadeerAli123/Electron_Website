import { Component, inject, signal } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteSettingService } from '../../../core/services/site-setting.service';

type ContactIcon = 'map' | 'phone' | 'mail';

interface NavItem {
  label: string;
  href: string;
}

interface ContactItem {
  icon: ContactIcon;
  label: string;
  link: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {

  siteSettingService = inject(SiteSettingService);
  setting$ = this.siteSettingService.setting$;

  currentYear = new Date().getFullYear();
  email = signal('');
  subscribed = signal(false);

  navItems: NavItem[] = [
    { label: 'الرئيسية', href: '/' },
    { label: 'الاصناف', href: '/categories' },
    { label: 'العروض', href: '/offers' },
    { label: 'تواصل معنا', href: '/contact-us' },
  ];

  // Why-us stats — static content
  stats = [
    { value: '+1000', label: 'عميل سعيد' },
    { value: '+500',  label: 'منتج متوفر' },
    { value: '24',    label: 'شهر تقسيط' },
    { value: '٠٪',    label: 'فوائد' }
  ];

  getContactItems(setting: any): ContactItem[] {
    const s = setting as any;
    return [
      {
        icon: 'map',
        label: s.address,
        link: s.location
          ? s.location
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address ?? '')}`
      },
      {
        icon: 'phone',
        label: s.phone,
        link: `tel:${s.phone}`
      },
      {
        icon: 'mail',
        label: s.email,
        link: `mailto:${s.email}`
      }
    ];
  }

  getSocialItems(setting: any) {
    const social = (setting as any).social_data;
    if (!social) return [];

    return [
      { key: 'facebook',  link: social.facebook,  icon: 'facebook'  },
      { key: 'instagram', link: social.instagram, icon: 'instagram' },
      { key: 'twitter',   link: social.twitter,   icon: 'twitter'   },
      { key: 'whatsapp',  link: social.whatsapp
          ? `https://wa.me/${social.whatsapp}`
          : null,                                  icon: 'whatsapp'  },
      { key: 'snapchat',  link: social.snapchat,  icon: 'snapchat'  },
      { key: 'youtube',   link: social.youtube,   icon: 'youtube'   },
    ].filter(item => !!item.link);
  }

  onSubscribe(event: Event): void {
    event.preventDefault();
    if (!this.email() || !this.email().includes('@')) return;
    this.subscribed.set(true);
    setTimeout(() => {
      this.subscribed.set(false);
      this.email.set('');
    }, 3000);
  }
}
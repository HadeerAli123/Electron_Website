import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { SiteSettingService } from './core/services/site-setting.service';

declare var AOS: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private siteSettingService: SiteSettingService,
    private titleService: Title,
    private meta: Meta,
  ) {}

  ngOnInit() {
    this.siteSettingService.loadSettings().subscribe((res) => {
      const data = res.data;
      if (!data) return;

      const title = data.all_settings?.meta_title || data.name_ar;
      if (title) this.titleService.setTitle(title);

      if (data.all_settings?.meta_description) {
        this.meta.updateTag({ name: 'description', content: data.all_settings.meta_description });
      }
      if (data.all_settings?.meta_keywords) {
        this.meta.updateTag({ name: 'keywords', content: data.all_settings.meta_keywords });
      }

      const faviconPath = data.all_settings?.favicon;
      if (faviconPath && isPlatformBrowser(this.platformId)) {
        const fullUrl = faviconPath.startsWith('http')
          ? faviconPath
          : `https://electronkw.com/dashboard/storage/${faviconPath}`;

        const link = document.getElementById('app-favicon') as HTMLLinkElement
          ?? document.querySelector("link[rel~='icon']") as HTMLLinkElement;

        if (link) {
          const img = new Image();
          img.onload = () => {
            link.href = `${fullUrl}?v=${Date.now()}`;
          };
          img.src = fullUrl;
        }
      }
    });

    if (isPlatformBrowser(this.platformId) && typeof AOS !== 'undefined') {
      AOS.init({ duration: 1000, once: true, offset: 100, easing: 'ease-in-out' });
    }
  }
}
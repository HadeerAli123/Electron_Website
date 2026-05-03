import { Component, OnInit, inject , ChangeDetectorRef, NgZone} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title, Meta } from '@angular/platform-browser';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SiteSettingService } from '../../core/services/site-setting.service';
import { environment } from '../../../environments/environment';
import { BackButton } from '../../shared/components/back-button/back-button';

interface Stat {
  id: number;
  label: string;
  value: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [HeroSection, RouterLink, CommonModule, BackButton],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About implements OnInit {
  stats: Stat[] = [];
  isLoading = false;
  aboutTitle = 'من نحن';
  aboutDescription = '';

  private http = inject(HttpClient);
  private titleService = inject(Title);
  private meta = inject(Meta);
  private siteSettingService = inject(SiteSettingService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit() {
    const setting = this.siteSettingService.setting;
    if (setting) {
      this.applySettings(setting);
    } else {
      this.siteSettingService.loadSettings().subscribe(res => {
        this.applySettings(res.data);
      });
    }

    this.isLoading = true;
    this.http.get<{ success: boolean; data: Stat[] }>(`${environment.apiUrl}/about-us/`)
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            this.stats = res.data;
            this.isLoading = false;
                        this.cdr.detectChanges();

          });
        },
        error: () => this.isLoading = false
      });
  }

  private applySettings(data: any) {
    if (data?.all_settings?.meta_title) {
      this.titleService.setTitle(data.all_settings.meta_title);
    }
    if (data?.all_settings?.meta_description) {
      this.meta.updateTag({ name: 'description', content: data.all_settings.meta_description });
    }

    this.aboutTitle = this.stripHtml(data?.all_settings?.about_us_title) || 'من نحن';
    this.aboutDescription = this.stripHtml(data?.all_settings?.about_us_description) || '';
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')      
      .replace(/&nbsp;/g, ' ')     
      .replace(/&amp;/g, '&')       
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}
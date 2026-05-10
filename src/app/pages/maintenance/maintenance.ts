import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { Router }                                from '@angular/router';
import { Subscription }                          from 'rxjs';
import { DomSanitizer, SafeHtml }               from '@angular/platform-browser';
import { SiteSettingService }                    from '../../core/services/site-setting.service';

@Component({
  selector:    'app-maintenance',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './maintenance.html',
  styleUrls:   ['./maintenance.css'],
})
export class Maintenance implements OnInit, OnDestroy {

  private siteService = inject(SiteSettingService);
  public  router      = inject(Router);
  private sanitizer   = inject(DomSanitizer);  
  private sub!: Subscription;

  siteName = 'إلكترون';
  logoUrl  = '';
  email    = 'store@electron.com.kw';
  year     = new Date().getFullYear();


  readonly steps: { label: string; status: 'done'|'now'|'soon'; icon: SafeHtml }[] = [
    {
      label:  'التحضير',
      status: 'done',
      icon: this.sanitizer.bypassSecurityTrustHtml(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>`),
    },
    {
      label:  'الصيانة',
      status: 'now',
      icon: this.sanitizer.bypassSecurityTrustHtml(`
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877
               M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766
               M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63
               m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336
               l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0
               00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085
               m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409
               l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75
               M4.867 19.125h.008v.008h-.008v-.008z"/>
        </svg>`),
    },
    {
      label:  'الإطلاق',
      status: 'soon',
      icon: this.sanitizer.bypassSecurityTrustHtml(`
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0cce0" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0
               006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926
               0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8
               m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7
               c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448
               14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757
               4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0
               1.5 1.5 0 013 0z"/>
        </svg>`),
    },
  ];

ngOnInit(): void {
  this.sub = this.siteService.setting$.subscribe(s => {
    if (!s) return;
    this.siteName = s.name_ar || 'إلكترون';
    this.email    = s.email   || this.email;
    this.logoUrl  = s.logo    || '';

    
     if ((s as any).maintenance_mode === false) {
       this.router.navigate(['/']);
     }
  });
}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
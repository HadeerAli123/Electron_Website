import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { Router, RouterLink }                    from '@angular/router';
import { Subscription }                          from 'rxjs';
import { DomSanitizer }                          from '@angular/platform-browser';

import { SiteSettingService }                    from '../../core/services/site-setting.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound implements OnInit, OnDestroy   {
  private siteService = inject(SiteSettingService);
  public  router      = inject(Router);
  private sub!: Subscription;
 
  siteName = 'إلكترون';
  logoUrl  = '';
  year     = new Date().getFullYear();
 
  ngOnInit(): void {
    this.sub = this.siteService.setting$.subscribe(s => {
      if (!s) return;
      this.siteName = s.name_ar || 'إلكترون';
      this.logoUrl  = s.logo    || '';
    });
  }
 
  goBack(): void {
    history.back();
  }
 
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

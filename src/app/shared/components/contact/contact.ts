import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MainForm } from '../../main-form/main-form';
import { SiteSettingService } from '../../../core/services/site-setting.service';

type ContactIcon = 'map' | 'phone' | 'mail';

interface ContactItem {
  icon: ContactIcon;
  label: string;
  link: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, MainForm],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {

  contactItems: ContactItem[] = [];

  constructor(private siteService: SiteSettingService) {}

  ngOnInit() {
    this.siteService.loadSettings().subscribe(() => {
      const data = this.siteService.setting;

      if (!data) return;

      this.contactItems = [
        {
          icon: 'map',
          label: data.address,
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
        },
        {
          icon: 'phone',
          label: data.phone,
          link: `tel:${data.phone}`
        },
        {
          icon: 'mail',
          label: data.email,
          link: `mailto:${data.email}`
        }
      ];
    });
  }
}
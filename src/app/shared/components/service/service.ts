import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Feature {
  icon: 'flexible' | 'instant' | 'no-fees';
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
  icon: 'calendar' | 'percent' | 'clock';
}

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service.html',
  styleUrl: './service.css',
})
export class Service {
  features: Feature[] = [
    {
      icon: 'flexible',
      title: 'تقسيط مرن',
      description: 'خطط تقسيط تناسب ميزانيتك من 3 إلى 24 شهر'
    },
    {
      icon: 'instant',
      title: 'موافقة فورية',
      description: 'احصل على الموافقة خلال دقائق واستلم منتجك اليوم'
    },
    {
      icon: 'no-fees',
      title: 'بدون فوائد',
      description: 'تقسيط بدون رسوم إضافية على معظم المنتجات'
    }
  ];

  stats: Stat[] = [
    { value: '٢٤',    label: 'شهر أقصى مدة', icon: 'calendar' },
    { value: '٠٪',    label: 'فوائد وعمولات', icon: 'percent' },
    { value: 'دقائق', label: 'وقت الموافقة',  icon: 'clock' }
  ];
}
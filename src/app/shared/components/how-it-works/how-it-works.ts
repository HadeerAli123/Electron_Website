import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StepIcon = 'zap' | 'cart' | 'doc' | 'check';

interface Step {
  number: string;
  title: string;
  desc: string;
  icon: StepIcon;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
})
export class HowItWorksComponent {
  steps: Step[] = [
    {
      number: '01',
      title: 'اختار منتجك المفضل',
      desc: 'تصفح مجموعتنا الواسعه من الاجهزه الالكترونيه و المنزليه و اختر ما يناسبك',
      icon: 'cart',
    },
    {
      number: '02',
      title: 'اختر خطة الدفع',
      desc: 'حدد خطة التقسيط المناسبة لك - نقداً أو بالتقسيط حتى 24 شهر',
      icon: 'doc',
    },
    {
      number: '03',
      title: 'قدم المستندات المطلوبة',
      desc: 'ارفع المستندات المطلوبة بسهولة عبر موقعنا الإلكتروني.',
      icon: 'check',
    },
    {
      number: '04',
      title: 'استلم وادفع لاحقًا',
      desc: 'استلم المنتج وابدأ التقسيط بسهولة.',
      icon: 'zap',
    },
  ];
}
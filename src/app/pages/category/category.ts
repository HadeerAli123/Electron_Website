import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CategoriesSectionComponent } from '../../shared/components/categories-section/categories-section';
import { BackButton } from '../../shared/components/back-button/back-button';
import { HeroSection } from '../../shared/components/hero-section/hero-section';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, HeroSection, RouterLink, CategoriesSectionComponent, BackButton],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category {

  /** Marketing features grid (static — designed for trust signals) */
  features = [
    {
      icon: 'discount',
      title: 'عروض حصرية',
      desc: 'خصومات تصل إلى 25% على المنتجات المختارة',
      colorClass: 'cat-feat-orange',
    },
    {
      icon: 'shield',
      title: 'جودة وضمان',
      desc: 'منتجات أصلية بضمان معتمد من الشركة',
      colorClass: 'cat-feat-blue',
    },
    {
      icon: 'truck',
      title: 'توصيل سريع',
      desc: 'استلم طلبك خلال 24-48 ساعة في الكويت',
      colorClass: 'cat-feat-green',
    },
    {
      icon: 'price',
      title: 'أسعار تنافسية',
      desc: 'أفضل الأسعار مقارنة بالأسواق المماثلة',
      colorClass: 'cat-feat-purple',
    },
    {
      icon: 'installment',
      title: 'تقسيط مريح',
      desc: 'حتى 24 شهر تقسيط بدون فوائد',
      colorClass: 'cat-feat-navy',
    },
  ];

  /** Stats — match the footer */
  stats = [
    { value: '+1000', label: 'عميل سعيد', icon: 'users' },
    { value: '+500',  label: 'منتج متوفر', icon: 'box' },
    { value: '24',    label: 'شهر تقسيط', icon: 'calendar' },
    { value: '٠٪',    label: 'فوائد', icon: 'check' },
  ];
}
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Stat {
  value: string;
  label: string;
  icon: 'shield' | 'users' | 'box';
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Hero {
  stats: Stat[] = [
    { value: '24/7', label: 'دعم فني',     icon: 'shield' },
    { value: '+1000', label: 'عميل',       icon: 'users' },
    { value: '+500', label: 'منتج متوفر', icon: 'box' }
  ];
}
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Hero } from '../../shared/components/hero/hero';
import { Offers } from '../../shared/components/offers/offers';
import { CategoriesSectionComponent } from '../../shared/components/categories-section/categories-section';
import { Service } from '../../shared/components/service/service';
import { HowItWorksComponent } from '../../shared/components/how-it-works/how-it-works';
import { Contact } from '../../shared/components/contact/contact';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Hero,
    Offers,
    CategoriesSectionComponent,
    Service,
    HowItWorksComponent,
    Contact,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
}
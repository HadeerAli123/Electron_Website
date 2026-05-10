import { Component } from '@angular/core';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { MainForm } from '../../shared/main-form/main-form';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-contact-us',
  imports: [HeroSection,MainForm, BackButton],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css',
  template: `
  <app-hero-section></app-hero-section>
  <app-main-form type="message"></app-main-form>
  `
})
export class ContactUs {

}

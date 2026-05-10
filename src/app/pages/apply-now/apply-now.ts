import { Component } from '@angular/core';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { MainForm } from '../../shared/main-form/main-form';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-apply-now',
  standalone: true,
  imports: [HeroSection,MainForm, BackButton],
  templateUrl: './apply-now.html',
  styleUrl: './apply-now.css',
    template: `
      <app-hero-section></app-hero-section>
        <app-main-form ></app-main-form>
    `
})
export class ApplyNow {

}

import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.html',
  styleUrl: './back-button.css',
})
export class BackButton {
  @Input() label: string = 'رجوع';

  @Input() fallback: string = '/';

  @Input() compact: boolean = false;

  private location = inject(Location);
  private router = inject(Router);

  goBack(): void {
    // Check if there's browser history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.fallback]);
    }
  }
}
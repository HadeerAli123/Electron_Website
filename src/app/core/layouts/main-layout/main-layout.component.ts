import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, FooterComponent, BottomNavComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer — desktop only -->
    <app-footer class="desktop-footer"></app-footer>

    <!-- Bottom Nav — mobile only -->
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    @media (max-width: 1023px) {
      .main-content {
        padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
      }
      
    }
  `]
})
export class MainLayout {}
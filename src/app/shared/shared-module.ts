import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    Navbar,
    FooterComponent
  ]
})
export class SharedModule {
  Navbar = Navbar;
  Footer = FooterComponent;
 }

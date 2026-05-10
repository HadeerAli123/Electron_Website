import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout.component';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Category } from './pages/category/category';
import {  CategoryDetails } from './pages/category-details/category-details';
import { ContactUs } from './pages/contact-us/contact-us';
import { ApplyNow } from './pages/apply-now/apply-now';
import { Profile } from './pages/profile/profile';
import { TrackOrder } from './pages/track-order/track-order';
import { ProductDetails } from './pages/product-details/product-details';
import { Brokers } from './pages/brokers/brokers';
import { CartComponent } from './pages/cart/cart';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import {OffersPage} from './pages/offers-page/offers-page'
import { OfferDetails } from './pages/offer-details/offer-details';
import { Maintenance } from './pages/maintenance/maintenance';
import { maintenanceGuard } from './core/guards/maintenance-guard';
import { NotFound } from './pages/not-found/not-found';
import { SearchPage } from './pages/search/search-page';
import { WishlistPage } from './pages/wishlist/wishlist-page';

export const routes: Routes = [
    {
    path: 'maintenance',
    component: Maintenance,
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [maintenanceGuard],
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'categories', component: Category },

      { path: 'category-details/:classId', component: CategoryDetails },
      { path: 'category-details/:classId/mark/:markId', component: CategoryDetails },
      { path: 'product/:id', component: ProductDetails },
      { path: 'contact-us', component: ContactUs },
      { path: 'apply-now', component: ApplyNow },
      { path: 'profile', component: Profile },
      { path: 'brokers', component:  Brokers },
      { path: 'track-order', component: TrackOrder },
      { path: 'cart', component: CartComponent },
      { path: 'offers', component: OffersPage },
      { path: 'offers/:id', component: OfferDetails },
      { path: 'search', component: SearchPage },
      { path: 'wishlist', component: WishlistPage },
      { path: 'register', component: Register },
      { path: 'login', component: Login  }
    ],
  },
  { path: '**', component: NotFound },

];
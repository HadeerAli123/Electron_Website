import { ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient( 
      withFetch(), 
      withInterceptors([authInterceptor])),
    provideRouter(routes),
        provideAnimations(),
    provideToastr({
  positionClass: 'toast-top-center',
  timeOut: 3000,
  closeButton: true,
  progressBar: true
})
  ]
};

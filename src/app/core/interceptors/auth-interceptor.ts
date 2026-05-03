import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';

const SKIP_AUTH_URLS = [
  '/cart/installment-plans'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);

  // تجاهل الـ endpoints اللي مش محتاجة auth
  const shouldSkip = SKIP_AUTH_URLS.some(url => req.url.includes(url));
  if (shouldSkip) {
    return next(req);
  }

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
    }
  }

  return next(req);
};
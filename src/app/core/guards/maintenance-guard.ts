import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { SiteSettingService } from '../services/site-setting.service';

export const maintenanceGuard: CanActivateFn = () => {
  const siteService = inject(SiteSettingService);
  const router = inject(Router);

  const current = siteService.setting;
  if (current) {
    return current.maintenance_mode
      ? router.createUrlTree(['/maintenance'])
      : true;
  }

  return siteService.loadSettings().pipe(
    map(res =>
      res.data?.maintenance_mode
        ? router.createUrlTree(['/maintenance'])
        : true
    ),
    catchError(() => of(true))
  );
};
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceFormat',
  standalone: true,
})
export class PriceFormatPipe implements PipeTransform {

  transform(value: number | string | null | undefined, decimals: number = 3): string {
    if (value === null || value === undefined || value === '') {
      return (0).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
      return (0).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const parts = num.toFixed(decimals).split('.');

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
  }
}
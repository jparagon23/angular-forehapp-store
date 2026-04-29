import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCop', standalone: true })
export class CurrencyCopPipe implements PipeTransform {
  transform(value: number | null): string {
    return '$' + (value ?? 0).toLocaleString('es-CO');
  }
}

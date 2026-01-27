import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date): string {
    if (!value) return '';

    const diff = Date.now() - new Date(value).getTime();
    const h = Math.floor(diff / 36e5);

    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }
}

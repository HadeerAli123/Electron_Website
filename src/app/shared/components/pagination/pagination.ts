import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    // Smart pagination — show max 5 pages around current
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }

    // Add first page + ellipsis
    if (range[0] > 2) range.unshift(-1); // ellipsis
    if (range[0] > 1) range.unshift(1);

    // Add last page + ellipsis
    if (range[range.length - 1] < total - 1) range.push(-2); // ellipsis
    if (range[range.length - 1] < total) range.push(total);

    return range;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage || page < 0) return;
    this.pageChange.emit(page);
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
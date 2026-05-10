import { Component, Input, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService } from '../../../core/services/categories.service';
import { Pagination } from '../pagination/pagination';

export interface DisplayCategory {
  id: number;
  name: string;
  image?: string | null;
  description?: string;
  productCount?: number;
}

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule, FormsModule, Pagination],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.css'
})
export class CategoriesSectionComponent implements OnInit {

  @Input() categoryId?: number;
  @Input() showButton: boolean = true;
  @Input() limit?: number;
  @Input() showPagination: boolean = false;

  categories: DisplayCategory[] = [];
  filteredCategories: DisplayCategory[] = [];
  searchQuery: string = '';
  isLoading = false;

  currentPage: number = 1;
  itemsPerPage: number = 8;

  constructor(
    private categoriesService: CategoriesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  // ── Search ──
  onSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredCategories = this.categories;
    } else {
      this.filteredCategories = this.categories.filter(c =>
        c.name.toLowerCase().includes(q)
      );
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCategories = this.categories;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // ── Pagination ──
  get paginatedCategories(): DisplayCategory[] {
    const source = this.filteredCategories;
    if (!this.showPagination) return source;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return source.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.itemsPerPage));
  }

  onPageChange(page: number) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  // ── Load ──
  loadCategories() {
    this.isLoading = true;
    this.categoriesService.getClassesWithMarks().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          const mapped: DisplayCategory[] = data.map(cls => ({
            id: cls.class.id,
            name: cls.class.name,
            image: cls.class.image ?? null,
            productCount: cls.marks?.length ?? 0
          }));
          this.categories = this.limit ? mapped.slice(0, this.limit) : mapped;
          this.filteredCategories = this.categories;
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onCategoryClick(category: DisplayCategory) {
    this.router.navigate(['/category-details', category.id]);
  }

  onAllCategoriesClick() {
    this.router.navigate(['/categories']);
  }
}
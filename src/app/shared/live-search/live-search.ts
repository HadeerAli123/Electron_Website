import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-live-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './live-search.html',
})
export class LiveSearch {

  searchControl = new FormControl('');

  @Output() searchChange = new EventEmitter<string>();

  constructor() {
    this.initSearch();
  }

  initSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.searchChange.emit(value?.trim() || '');
      });
  }
}
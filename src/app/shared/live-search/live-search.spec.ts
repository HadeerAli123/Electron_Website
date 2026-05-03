import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveSearch } from './live-search';

describe('LiveSearch', () => {
  let component: LiveSearch;
  let fixture: ComponentFixture<LiveSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

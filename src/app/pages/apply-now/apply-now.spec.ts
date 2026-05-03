import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyNow } from './apply-now';

describe('ApplyNow', () => {
  let component: ApplyNow;
  let fixture: ComponentFixture<ApplyNow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyNow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyNow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

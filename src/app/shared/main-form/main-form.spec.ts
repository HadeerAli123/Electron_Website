import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainForm } from './main-form';

describe('MainForm', () => {
  let component: MainForm;
  let fixture: ComponentFixture<MainForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

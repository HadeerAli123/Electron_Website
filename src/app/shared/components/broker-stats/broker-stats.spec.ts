import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerStats } from './broker-stats';

describe('BrokerStats', () => {
  let component: BrokerStats;
  let fixture: ComponentFixture<BrokerStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrokerStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

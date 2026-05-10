import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderInvoiceModal } from './order-invoice-modal';

describe('OrderInvoiceModal', () => {
  let component: OrderInvoiceModal;
  let fixture: ComponentFixture<OrderInvoiceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderInvoiceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderInvoiceModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

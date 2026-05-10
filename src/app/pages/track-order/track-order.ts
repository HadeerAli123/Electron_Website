import { CommonModule } from '@angular/common';
import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment.prod';

@Component({
  selector: 'app-track-order',
  imports: [CommonModule, RouterLink],
  templateUrl: './track-order.html',
  styleUrl: './track-order.css',
})
export class TrackOrder implements OnInit {
  status: 'form' | 'found' | 'notfound' = 'form';
  orderData: any = null;
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private router: Router // ✅
  ) {}


  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.toastr.warning('يجب تسجيل الدخول أولاً');
      this.router.navigate(['/login']);
    }
  }

  trackOrder(orderCode: string) {
    if (!orderCode.trim()) {
      this.toastr.warning('من فضلك أدخل كود الطلب');
      return;
    }

    this.isLoading = true;
    const token = localStorage.getItem('token');

    this.http.get(
      `${environment.apiUrl}/orders/track/${orderCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          if (res.success) {
            this.orderData = res.data;
            this.status = 'found';
            this.toastr.success('تم العثور على الطلب');
          } else {
            this.status = 'notfound';
            this.toastr.error('هذا الطلب غير مرتبط بحسابك');
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.status = 'notfound';
          this.isLoading = false;
          this.toastr.error('حدث خطأ أثناء البحث عن الطلب');
          this.cdr.detectChanges();
        });
      }
    });
  }

  reset() {
    this.status = 'form';
    this.orderData = null;
    this.cdr.detectChanges();
  }

  get isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}
}
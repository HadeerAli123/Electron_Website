import { Component, OnInit, NgZone, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerStats } from '../../shared/components/broker-stats/broker-stats';
import { ProfileService, BrokerStats as BrokerStatsInterface } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BrokerStats, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {

  user: any = null;
  isLoading = true;
  errorMessage = '';
  isEditing = false;
  isSaving = false;
showPassword = false;
 
  editData = {
    name: '',
    email: '',
    phone: '',
    national_id: ''
  };

  brokerStats: BrokerStatsInterface = {
    clients: 0,
    balance: 0,
    commissions: 0,
    monthlySales: 0
  };

  private toastr = inject(ToastrService);

  constructor(
    private profileService: ProfileService,
    public authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.user = data;
          if (data.role === 'broker') this.loadBrokerStats();
          this.isLoading = false;
          this.cdr.markForCheck()
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          if (error.status === 401) {
            this.errorMessage = 'انتهت جلستك، يرجى تسجيل الدخول مرة أخرى';
            setTimeout(() => this.authService.logout(), 2000);
          } else if (error.status === 0) {
            this.errorMessage = 'تعذر الاتصال بالخادم';
          } else {
            this.errorMessage = 'حدث خطأ أثناء تحميل البيانات';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadBrokerStats() {
    this.profileService.getBrokerStats().subscribe({
      next: (stats) => {
        this.ngZone.run(() => {
          this.brokerStats = stats;
          this.cdr.detectChanges();
        });
      },
      error: (error) => console.error('Error loading broker stats:', error)
    });
  }


  startEdit() {
    this.editData = {
      name: this.user.name || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      national_id: this.user.national_id || ''
    };
    this.isEditing = true;
    this.cdr.detectChanges();
  }

  
  cancelEdit() {
    this.isEditing = false;
    this.cdr.detectChanges();
  }

 
  saveProfile() {
    if (this.isSaving) return;
    this.isSaving = true;

    this.profileService.updateProfile(this.editData).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.user = data;
          this.isEditing = false;
          this.isSaving = false;
          this.toastr.success('تم تحديث البيانات بنجاح ✅');
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.isSaving = false;
          this.toastr.error(error.error?.message || 'حدث خطأ أثناء التحديث');
          this.cdr.detectChanges();
        });
      }
    });
  }

  get isBroker(): boolean {
    return this.user?.role === 'broker';
  }

  get memberSince(): string {
    if (!this.user?.created_at) return '';
    const date = new Date(this.user.created_at);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  get userInitial(): string {
    return this.user?.name?.charAt(0).toUpperCase() || 'U';
  }
}
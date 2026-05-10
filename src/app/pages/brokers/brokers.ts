import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-brokers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroSection, BackButton],
  templateUrl: './brokers.html',
  styleUrl: './brokers.css',
})
export class Brokers implements OnInit {
  brokerForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  serverErrors: Record<string, string[]> = {};
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.brokerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
        phone: ['', [Validators.pattern(/^[0-9]{8}$/)]],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.maxLength(255),
            Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/i),
          ],
        ],
        national_id: [
          '',
          [Validators.pattern(/^[23][0-9]{11}$/)],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
        role: ['agent'],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: AbstractControl) {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  get passwordMismatch(): boolean {
    return (
      this.brokerForm.hasError('passwordMismatch') &&
      (this.brokerForm.get('password_confirmation')?.touched ?? false)
    );
  }

  isFieldInvalid(field: string): boolean {
    const control = this.brokerForm.get(field);
    return (
      (!!control && control.invalid && control.touched) ||
      !!this.serverErrors[field]?.length
    );
  }

  getFieldError(field: string): string {
    if (this.serverErrors[field]?.length) {
      return this.serverErrors[field][0];
    }

    const control = this.brokerForm.get(field);
    if (!control || !control.touched || !control.errors) return '';

    const messages: Record<string, Record<string, string>> = {
      name: {
        required: 'الاسم مطلوب',
        minlength: 'الاسم يجب أن يكون 3 أحرف على الأقل',
        maxlength: 'الاسم يجب ألا يتجاوز 255 حرف',
      },
      email: {
        required: 'البريد الإلكتروني مطلوب',
        email: 'البريد الإلكتروني غير صحيح',
        pattern: 'يجب أن ينتهي البريد بـ .com',
        maxlength: 'البريد الإلكتروني يجب ألا يتجاوز 255 حرف',
      },
      phone: {
        pattern: 'رقم الهاتف يجب أن يتكون من 8 أرقام',
      },
      national_id: {
        pattern: 'الرقم القومي يجب أن يبدأ بـ 2 أو 3 ويتكون من 12 رقماً',
      },
      password: {
        required: 'كلمة المرور مطلوبة',
        minlength: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      },
      password_confirmation: {
        required: 'تأكيد كلمة المرور مطلوب',
      },
    };

    const fieldMessages = messages[field] || {};
    for (const key of Object.keys(control.errors)) {
      if (fieldMessages[key]) return fieldMessages[key];
    }
    return '';
  }

  clearServerError(field: string): void {
    if (this.serverErrors[field]) delete this.serverErrors[field];
  }

  onSubmit(): void {
    if (this.brokerForm.invalid || this.isSubmitting) {
      this.brokerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.serverErrors = {};

    const formData = { ...this.brokerForm.value };
    if (!formData.national_id) delete formData.national_id;
    if (!formData.phone) delete formData.phone;

    this.authService.register(formData).subscribe({
      next: () => {
        
        this.authService.clearSessionOnly();
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;

        if (err.status === 422 && err.error?.errors) {
          this.serverErrors = err.error.errors;
        } else if (err.status === 403) {
          this.submitError = err.error?.message || 'حسابك قيد المراجعة، يرجى الانتظار حتى يتم اعتماده';
        } else {
          this.submitError = err.error?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى';
        }

        this.cdr.detectChanges();
      },
    });
  }
}
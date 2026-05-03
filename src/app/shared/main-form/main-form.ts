import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { ToastrService } from 'ngx-toastr';

function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const email = control.value as string;
  const basicPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!basicPattern.test(email)) return { email: true };

  const parts = email.split('@');
  if (parts.length !== 2) return { email: true };

  const domain = parts[1].toLowerCase();
  const fakeTlds = ['.test', '.invalid', '.localhost', '.local', '.example', '.fake'];
  if (fakeTlds.some(t => domain.endsWith(t))) return { invalidDomain: true };
  if (!domain.includes('.')) return { invalidDomain: true };

  const tld = domain.split('.').pop() ?? '';
  if (tld.length < 2) return { invalidDomain: true };
  if (domain.startsWith('-') || domain.startsWith('.')) return { invalidDomain: true };
  if (email.includes('..')) return { invalidDomain: true };

  return null;
}

@Component({
  selector: 'app-main-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './main-form.html',
  styleUrl: './main-form.css',
})
export class MainForm implements OnInit {

  form!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z\u0600-\u06FF ]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z\u0600-\u06FF ]+$/)
      ]],
      phone: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8),
        Validators.pattern(/^[0-9]+$/)
      ]],
      email: ['', [
        Validators.required,
        strictEmailValidator
      ]],
      message: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      const firstInvalid = document.querySelector('.ng-invalid');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }

      this.toastr.warning('يرجى مراجعة البيانات المدخلة', 'تنبيه ⚠️');
      return;
    }

    this.sendContactMessage();
  }

  sendContactMessage() {
    this.isLoading = true;

    const contactData = {
      fname: this.form.value.firstName,
      lname: this.form.value.lastName,
      email: this.form.value.email,
      phone: this.form.value.phone,
      message: this.form.value.message
    };

    this.contactService.sendMessage(contactData).subscribe({
      next: (response) => {
        this.toastr.success(response.message || 'تم إرسال رسالتك بنجاح', 'نجاح ✅');
        this.form.reset();
        this.isLoading = false;
      },
      error: (error) => {
        if (error.status === 0) {
          this.toastr.error('تعذر الاتصال بالسيرفر، تحقق من الإنترنت', 'خطأ في الاتصال 🔌');
        } else if (error.status >= 500) {
          this.toastr.error('حدث خطأ في السيرفر، حاول مرة أخرى', 'خطأ في السيرفر 🛑');
        } else if (error.error?.errors) {
          this.applyServerErrors(error.error.errors);
          this.toastr.error('البيانات المدخلة غير مقبولة', 'خطأ ❌');
        } else {
          this.toastr.error(error.error?.message || 'حدث خطأ غير متوقع', 'خطأ ❌');
        }
        this.isLoading = false;
      }
    });
  }

  private applyServerErrors(errors: Record<string, string[]>) {
    const fieldMap: Record<string, string> = {
      fname: 'firstName',
      lname: 'lastName',
      email: 'email',
      phone: 'phone',
      message: 'message',
    };

    for (const [serverField, messages] of Object.entries(errors)) {
      const controlName = fieldMap[serverField] ?? serverField;
      const control = this.form.get(controlName);
      if (control) {
        control.setErrors({ serverError: messages[0] });
        control.markAsTouched();
      }
    }
  }

  get messageLength(): number {
    return this.form.get('message')?.value?.length || 0;
  }

  get messageCounterClass(): string {
    const len = this.messageLength;
    if (len === 0) return 'text-gray-400';
    if (len < 10) return 'text-red-400';
    if (len > 900) return 'text-orange-400';
    return 'text-green-500';
  }

  getError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    if (control.hasError('serverError')) return control.errors?.['serverError'];
    if (control.hasError('required')) return 'هذا الحقل مطلوب';
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      if (fieldName === 'phone') return 'رقم الهاتف يجب أن يكون 8 أرقام بالظبط';
      if (control.hasError('minlength')) return `الحد الأدنى ${control.errors?.['minlength'].requiredLength} حروف`;
      if (control.hasError('maxlength')) return `الحد الأقصى ${control.errors?.['maxlength'].requiredLength} حرف`;
    }
    if (control.hasError('invalidDomain')) return 'نطاق البريد غير صالح (مثال: name@gmail.com)';
    if (control.hasError('email')) return 'البريد الإلكتروني غير صحيح';
    if (control.hasError('pattern')) {
      if (fieldName === 'firstName' || fieldName === 'lastName') return 'الاسم يجب أن يحتوي على حروف فقط';
      if (fieldName === 'phone') return 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
      return 'صيغة غير صحيحة';
    }

    return '';
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BackButton],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {

    this.registerForm = this.fb.group(
      {
        name: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255)
        ]],

email: ['', [
  Validators.required,
  Validators.maxLength(255),
  Validators.pattern(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  )
]],

      national_id: ['', [
  Validators.required,
  Validators.pattern(/^[23]\d{11}$/)
]],

        phone: ['', [
          Validators.required,
          Validators.maxLength(8),
          Validators.pattern(/^\d{8}$/) 
        ]],

        password: ['', [
          Validators.required,
          Validators.minLength(8)
        ]],

        confirmPassword: ['', [Validators.required]],

        role: ['customer'], 
      },
      {
        validators: (group) => {
          const password = group.get('password')?.value;
          const confirm = group.get('confirmPassword')?.value;
          return password === confirm ? null : { passwordMismatch: true };
        },
      }
    );

   
    ['name', 'email', 'phone', 'national_id', 'password'].forEach(field => {
      this.registerForm.get(field)?.valueChanges.subscribe(() => {
        const control = this.registerForm.get(field);
        if (control?.errors?.['serverError']) {
          const { serverError, ...otherErrors } = control.errors;
          control.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
        }
      });
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastr.warning('يرجى ملء جميع البيانات بشكل صحيح');
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      national_id: this.registerForm.value.national_id,
      phone: this.registerForm.value.phone,
      password: this.registerForm.value.password,
      password_confirmation: this.registerForm.value.confirmPassword,
      role: this.registerForm.value.role,
    };

    this.authService.register(formData).subscribe({
      next: () => {
        this.toastr.success('تم التسجيل بنجاح!');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
      },

    
      error: (error) => {
        this.isLoading = false;

        const errors = error.error?.errors;

        if (errors) {
          Object.keys(errors).forEach(field => {
            const control = this.registerForm.get(field);

            if (control) {
              const currentErrors = control.errors || {};

              control.setErrors({
                ...currentErrors,
                serverError: errors[field][0]
              });

              control.markAsTouched();
            }
          });

          this.toastr.error('يرجى مراجعة البيانات');
        } else {
          this.errorMessage = error.error?.message || 'حدث خطأ';
          this.toastr.error(this.errorMessage);
        }

        this.cdr.detectChanges();
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  hasError(field: string, error: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control?.hasError(error) && (control?.touched || control?.dirty));
  }


  getServerError(field: string): string | null {
    const control = this.registerForm.get(field);
    return control?.errors?.['serverError'] || null;
  }
}
import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { BackButton } from '../../shared/components/back-button/back-button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BackButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {

   
    this.loginForm = this.fb.group({
      national_id: ['', [
        Validators.required,
        Validators.pattern(/^[23]\d{11}$/) 
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
    });

    ['national_id', 'password'].forEach(field => {
      this.loginForm.get(field)?.valueChanges.subscribe(() => {
        const control = this.loginForm.get(field);

        if (control?.errors?.['serverError']) {
          const { serverError, ...otherErrors } = control.errors;
          control.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
        }
      });
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.warning('يرجى إدخال البيانات بشكل صحيح');
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formData = this.loginForm.value;

    this.authService.login(formData).subscribe({
      next: (response) => {
        this.toastr.success('تم تسجيل الدخول بنجاح');
        this.router.navigate(['/']);
      },

      error: (error) => {
        this.isLoading = false;

        const errors = error.error?.errors;

        if (errors) {
          Object.keys(errors).forEach(field => {
            const control = this.loginForm.get(field);

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
          this.errorMessage = error.error?.message || 'بيانات الدخول غير صحيحة';
          this.toastr.error(this.errorMessage);
        }

        this.cdr.detectChanges();
      },

      complete: () => {
        this.isLoading = false;
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.hasError(error) && (control?.touched || control?.dirty));
  }

  getServerError(field: string): string | null {
    const control = this.loginForm.get(field);
    return control?.errors?.['serverError'] || null;
  }
}
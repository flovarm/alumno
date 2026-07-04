import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';


@Component({
    selector: 'app-change-password-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>lock_reset</mat-icon>
      Cambiar contraseña
    </h2>

    <mat-dialog-content>
      <form [formGroup]="passwordForm" class="password-form">
        <mat-form-field appearance="outline">
          <mat-label>Contraseña actual</mat-label>
          <input matInput [type]="hideCurrentPassword() ? 'password' : 'text'" formControlName="currentPassword">
          <button mat-icon-button matSuffix type="button" (click)="hideCurrentPassword.set(!hideCurrentPassword())">
            <mat-icon>{{ hideCurrentPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (passwordForm.get('currentPassword')?.hasError('required')) {
              <mat-error>
                La contraseña actual es obligatoria
               </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nueva contraseña</mat-label>
          <input matInput [type]="hideNewPassword() ? 'password' : 'text'" formControlName="newPassword">
          <button mat-icon-button matSuffix type="button" (click)="hideNewPassword.set(!hideNewPassword())">
            <mat-icon>{{ hideNewPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (passwordForm.get('newPassword')?.hasError('required')) {
              <mat-error>
                La nueva contraseña es obligatoria
              </mat-error>
          }
          @if (passwordForm.get('newPassword')?.hasError('minlength')) {
              <mat-error>
                La contraseña debe tener al menos 6 caracteres
              </mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Confirmar nueva contraseña</mat-label>
          <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword">
          <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword.set(!hideConfirmPassword())">
            <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (passwordForm.get('confirmPassword')?.hasError('required')){
                <mat-error>
                  La confirmación es obligatoria
                </mat-error>

            }
          
            @if (passwordForm.get('confirmPassword')?.hasError('passwordMismatch')) {
            <mat-error>Las contraseñas no coinciden</mat-error>
            }

        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button class="btn-primary" [disabled]="passwordForm.invalid || isLoading()" (click)="onSubmit()">
        {{ isLoading() ? 'Actualizando...' : 'Actualizar contraseña' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--mat-sys-primary);
    }

    .password-form {
      min-width: 340px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.5rem;
    }

    mat-form-field {
      width: 100%;
    }

    .btn-primary {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .btn-primary[disabled] {
      opacity: 0.7;
    }

    @media (max-width: 480px) {
      .password-form {
        min-width: 100%;
      }
    }
  `]
})
export class ChangePasswordDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly snackBar = inject(MatSnackBar);

    isLoading = signal(false);
    hideCurrentPassword = signal(true);
    hideNewPassword = signal(true);
    hideConfirmPassword = signal(true);

    passwordForm: FormGroup = this.fb.group(
        {
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        },
        { validators: this.passwordMatchValidator }
    );


    private passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword');
        const confirmPassword = form.get('confirmPassword');

        if (!newPassword || !confirmPassword) return null;

        if (newPassword.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
        } else {
            const errors = confirmPassword.errors;
            if (errors) {
                delete errors['passwordMismatch'];
                if (Object.keys(errors).length === 0) {
                    confirmPassword.setErrors(null);
                } else {
                    confirmPassword.setErrors(errors);
                }
            }
        }

        return null;
    }

    onSubmit(): void {
        if (this.passwordForm.invalid) {
            return;
        }

        this.isLoading.set(true);

        const currentPassword = this.passwordForm.get('currentPassword')?.value;
        const newPassword = this.passwordForm.get('newPassword')?.value;

        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: () => {
                this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (error) => {
                const message = error?.error?.message || error?.error || 'No se pudo actualizar la contraseña';
                this.snackBar.open(message, 'Cerrar', { duration: 5000 });
                this.isLoading.set(false);
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}

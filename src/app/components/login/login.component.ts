import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ThemeService } from '../../_services/theme.service';
import { AuthService } from '../../services/auth.service';
import { SnackService } from '../../services/snack.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private snackService = inject(SnackService);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(11)]], // DNI de 8 dígitos
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  // Getter para el tema actual
  get currentTheme() {
    return this.themeService.selectedTheme();
  }

  // Getter para acceder fácilmente a los controles del formulario
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  // Alternar visibilidad de la contraseña
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  // Método para iniciar sesión
  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const { username, password } = this.loginForm.value;
      
      // Usar el nuevo método login que retorna Observable
      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.snackService.success(`¡Bienvenido ${response.nombreCompleto}!`, {
            duration: 3000
          });
          
          // Navegar al home/dashboard
          this.router.navigate(['/home']);
        },
        error: (errorMessage) => {
          this.snackService.danger(errorMessage || 'Error al iniciar sesión', {
            duration: 5000
          });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Mostrar errores de validación
      this.markFormGroupTouched();
      this.snackService.warning('Por favor, completa todos los campos correctamente', {
        duration: 3000
      });
    }
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Obtener mensaje de error para el campo username (DNI)
  getUsernameErrorMessage() {
    if (this.username?.hasError('required')) {
      return 'El DNI es requerido';
    }
    if (this.username?.hasError('minlength') || this.username?.hasError('maxlength')) {
      return 'El DNI debe tener exactamente 8 dígitos';
    }
    return '';
  }

  // Obtener mensaje de error para el campo password
  getPasswordErrorMessage() {
    if (this.password?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (this.password?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 3 caracteres';
    }
    return '';
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-pago-exitoso',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="¡Pago Exitoso!"
        description="Tu matrícula ha sido procesada correctamente"
        icon="check_circle">
      </app-page-header>

      <div class="success-container">
        <mat-card class="success-card">
          <mat-card-content>
            <div class="success-content">
              <div class="success-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              
              <h2 class="success-title">¡Felicitaciones!</h2>
              
              <p class="success-message">
                El pago ha sido procesado satisfactoriamente.
              </p>
              
            
              
              <p class="registration-message">
                Ya te encuentras registrado en este nuevo periodo académico.
              </p>
              
              <div class="thank-you">
                <mat-icon>favorite</mat-icon>
                <span>¡Gracias por confiar en nosotros!</span>
              </div>
              
              <div class="actions">
                <button mat-raised-button color="primary" (click)="irAHome()">
                  <mat-icon>home</mat-icon>
                  Ir al Inicio
                </button>
                
                <button mat-stroked-button color="accent" (click)="verHistorialAcademico()">
                  <mat-icon>school</mat-icon>
                  Ver Mi Historial
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .success-card {
      width: 100%;
      max-width: 600px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, var(--mat-sys-primary-container) 0%, var(--mat-sys-surface) 100%);
    }

    .success-content {
      text-align: center;
      padding: 2rem;
    }

    .success-icon {
      margin-bottom: 1.5rem;
    }

    .success-icon mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: var(--mat-sys-primary);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .success-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
      margin: 0 0 1rem 0;
    }

    .success-message {
      font-size: 1.3rem;
      color: var(--mat-sys-on-surface);
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .registration-message {
      font-size: 1.1rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      border-left: 4px solid var(--mat-sys-primary);
    }

    .thank-you {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 1.1rem;
      color: var(--mat-sys-secondary);
      font-weight: 500;
    }

    .thank-you mat-icon {
      color: var(--mat-sys-secondary);
      animation: heartbeat 1.5s ease-in-out infinite;
    }

    @keyframes heartbeat {
      0% { transform: scale(1); }
      25% { transform: scale(1.1); }
      50% { transform: scale(1); }
      75% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .actions button {
      min-width: 200px;
      font-size: 1rem;
      padding: 0.75rem 2rem;
      border-radius: 25px;
    }

    @media (min-width: 600px) {
      .actions {
        flex-direction: row;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .success-title {
        font-size: 2rem;
      }
      
      .success-message {
        font-size: 1.1rem;
      }
      
      .success-icon mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
    }
  `]
})
export class PagoExitosoComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit() {
    // Opcional: Auto-redirigir después de un tiempo
    // setTimeout(() => {
    //   this.irAHome();
    // }, 10000); // 10 segundos
  }

  irAHome() {
    this.router.navigate(['/home']);
  }

  verHistorialAcademico() {
    this.router.navigate(['/historial-academico']);
  }
}

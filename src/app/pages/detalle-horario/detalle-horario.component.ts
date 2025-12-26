import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-detalle-horario',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="detalle-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Detalle del Horario Seleccionado</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="info-row">
            <strong>Curso:</strong> {{ horario?.nombreCurso }}
          </div>
          <div class="info-row">
            <strong>Profesor:</strong> {{ horario?.nombreProfesor }}
          </div>
          <div class="info-row">
            <strong>Turno:</strong> {{ horario?.turno }}
          </div>
          <div class="info-row">
            <strong>Modalidad:</strong> {{ horario?.modalidad }}
          </div>
          <div class="info-row">
            <strong>Aula:</strong> {{ horario?.nombreAula }}
          </div>
          <div class="info-row">
            <strong>Fecha Inicio:</strong> {{ horario?.fechaInicio | date:'shortDate' }}
          </div>
          <div class="info-row">
            <strong>Fecha Fin:</strong> {{ horario?.fechaFin | date:'shortDate' }}
          </div>
          <div class="info-row">
            <strong>Pago:</strong> S/ {{ pago() }}
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary">Realizar Pago</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .detalle-container {
      max-width: 500px;
      margin: 2rem auto;
    }
    .info-row {
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
    }
  `]
})
export class DetalleHorarioComponent implements OnInit {
  @Input() horario: any;
  pago = signal<number>(0);

  ngOnInit() {
    // Simulación de obtención de pago (puedes reemplazar por llamada a servicio)
    if (this.horario) {
      // Ejemplo: pago depende de modalidad
      this.pago.set(this.horario.modalidad === 'Presencial' ? 350 : 250);
    }
  }
}

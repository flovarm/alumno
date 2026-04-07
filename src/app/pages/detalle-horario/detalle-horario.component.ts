import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-detalle-horario',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule],
  template: `
    <div class="detalle-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Detalle del Horario Seleccionado</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item>
              <span matListItemTitle>Alumno</span>
              <span matListItemLine>{{ nombreAlumno() }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Curso</span>
              <span matListItemLine>{{ horario?.nombreCurso }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Profesor</span>
              <span matListItemLine>{{ horario?.nombreProfesor }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Turno</span>
              <span matListItemLine>{{ horario?.turno }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Modalidad</span>
              <span matListItemLine>{{ horario?.modalidad }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Aula</span>
              <span matListItemLine>{{ horario?.nombreAula }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Fecha Inicio</span>
              <span matListItemLine>{{ horario?.fechaInicio | date:'shortDate' }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Fecha Fin</span>
              <span matListItemLine>{{ horario?.fechaFin | date:'shortDate' }}</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Pago</span>
              <span matListItemLine>S/ {{ pago() }}</span>
            </mat-list-item>
          </mat-list>
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
  private readonly authService = inject(AuthService);
  pago = signal<number>(0);
  readonly nombreAlumno = signal('');

  ngOnInit() {
    this.nombreAlumno.set(
      this.authService.currentUser()?.nombreCompleto ||
      this.horario?.nombreAlumno ||
      this.horario?.alumno ||
      'Alumno no disponible'
    );

    if (this.horario) {
      this.pago.set(this.horario.modalidad === 'Presencial' ? 350 : 250);
    }
  }
}

import { Component, input } from "@angular/core";
import { TitleCasePipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { UltimoRegistro } from "../../models/ultimo-registro";

@Component({
  selector: "app-ultimo-curso",
  standalone: true,
  imports: [TitleCasePipe, MatCardModule, MatIconModule],
  template: `
    @if (registro(); as curso) {
      <mat-card class="ultimo-registro-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Último Registro Académico</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="ultimo-registro-grid">
            <div class="registro-item">
              <mat-icon>calendar_today</mat-icon>
              <div><div class="registro-label">Período</div><div class="registro-value">{{ curso.periodo }}</div></div>
            </div>
            <div class="registro-item">
              <mat-icon>book</mat-icon>
              <div><div class="registro-label">Curso</div><div class="registro-value">{{ curso.curso | titlecase }}</div></div>
            </div>
            <div class="registro-item">
              <mat-icon>grade</mat-icon>
              <div><div class="registro-label">Nota</div>
                <div class="registro-value" [style.color]="curso.apruebaReg === 'P' ? 'var(--mat-sys-primary)' : 'var(--mat-sys-secondary)'">{{ curso.notaRegistro ?? 'Pendiente' }}</div>
              </div>
            </div>
            <div class="registro-item">
              <mat-icon>location_on</mat-icon>
              <div><div class="registro-label">Sede</div><div class="registro-value">{{ curso.nombreSed }}</div></div>
            </div>
            <div class="registro-item">
              <mat-icon>schedule</mat-icon>
              <div><div class="registro-label">Turno</div><div class="registro-value">{{ curso.turno }}</div></div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`:host { display: block; margin-bottom: 24px; }`],
})
export class UltimoCursoComponent {
  readonly registro = input<UltimoRegistro | null>(null);
}

import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "app-evento-dialog",
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatDividerModule,
    MatCardModule,
  ],
  templateUrl: "./Evento-dialog.component.html",
  styleUrl: "./evento-dialog.component.scss",
})
export class EventoDialogComponent {
  evento: any;

  constructor(
    public dialogRef: MatDialogRef<EventoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.evento = data.evento;
  }

  cerrarDialog(): void {
    this.dialogRef.close();
  }

  registrarAsistencia(): void {
    // Aquí implementarías la lógica para registrar la asistencia
    // Por ejemplo, llamar a un servicio para registrar la asistencia
    console.log("Registrando asistencia para el evento:", this.evento.titulo);

    // Puedes agregar aquí la llamada al servicio cuando esté disponible
    // this.asistenciaService.registrarAsistencia(this.evento.id).subscribe(...);

    // Cerrar el dialog enviando una señal de que se registró la asistencia
    this.dialogRef.close("asistencia_registrada");
  }
}

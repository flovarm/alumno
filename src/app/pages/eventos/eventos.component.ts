import { Component, inject, OnInit } from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { EventoDialogComponent } from "./evento-dialog/evento-dialog.component";
import { EventoService } from "../../services/evento.service";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
  selector: "app-eventos",
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule,
    PageHeaderComponent,
  ],
  templateUrl: "./eventos.component.html",
  styleUrl: "./eventos.component.scss",
})
export class EventosComponent implements OnInit {
  private dialog = inject(MatDialog);
  private eventoService = inject(EventoService);
  eventos: any[] = [];
  ngOnInit(): void {
    this.eventosDesdeAhora();
  }

  abrirDialogEvento(evento: any) {
    const dialogRef = this.dialog.open(EventoDialogComponent, {
      width: "600px",
      maxHeight: "80vh",
      disableClose: false,
      data: { evento: evento },
      panelClass: ["animate__animated", "animate__backInUp"],
    });

    dialogRef.afterClosed().subscribe((resultado) => {});
  }

  eventosDesdeAhora() {
    this.eventoService.listarEventosDesdeAhora().subscribe((eventos) => {
      this.eventos = eventos as any[];
    });
  }
}

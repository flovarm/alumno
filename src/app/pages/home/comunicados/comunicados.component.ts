import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';


interface ComunicadoApi {
  id: number;
  titulo: string;
  descripcion: string;
  urlFoto: string;
  estado: boolean;
  fechaInicio?: string;
  fechaFinal?: string;
  fechaRegistro?: string;
  fechaModificacion?: string;
  idUsuarioModificacion?: number;
  idUsurioRegistro?: number;
}

interface ComunicadoViewModel {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
}

@Component({
  selector: 'app-comunicados',
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './comunicados.component.html',
  styleUrl: './comunicados.component.scss',
})


export class ComunicadosComponent {
  currentIndex = 0;

  comunicados: ComunicadoViewModel[];

  constructor(
    public dialogRef: MatDialogRef<ComunicadosComponent>,
    @Inject(MAT_DIALOG_DATA) comunicados: ComunicadoApi[] | null,
  ) {
    this.comunicados = (comunicados ?? []).map((comunicado) => ({
      id: comunicado.id,
      titulo: comunicado.titulo,
      descripcion: comunicado.descripcion,
      imagen: this.resolveImageUrl(comunicado.urlFoto),
    }));
  }

  get comunicadoActual(): ComunicadoViewModel | null {
    return this.comunicados[this.currentIndex] ?? null;
  }

  next(): void {
    if (this.comunicados.length === 0) {
      return;
    }

    this.currentIndex = (this.currentIndex + 1) % this.comunicados.length;
  }

  prev(): void {
    if (this.comunicados.length === 0) {
      return;
    }

    this.currentIndex = (this.currentIndex - 1 + this.comunicados.length) % this.comunicados.length;
  }

  close(): void {
    this.dialogRef.close();
  }

  private resolveImageUrl(urlFoto: string | null | undefined): string {
    if (!urlFoto) {
      return 'https://picsum.photos/800/400?grayscale';
    }

    try {
      return new URL(urlFoto, environment.apiUrl).toString();
    } catch {
      return urlFoto;
    }
  }
}

import { Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { AlumnoService } from '../../services/alumno.service';
import { SnackService } from '../../services/snack.service';

@Component({
  selector: 'app-clases-virtuales',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, PageHeaderComponent],
  templateUrl: './clases-virtuales.component.html',
  styleUrl: './clases-virtuales.component.scss',
})
export class ClasesVirtualesComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private snack = inject(SnackService);
  private destroyRef = inject(DestroyRef);
  readonly user = JSON.parse(localStorage.getItem('alumno_currentUser') || '{}');
  loading = false;
  teamsEmail = '';
  errorMessage = '';
  passwordVisible = false;

  mostrarPassword(event: PointerEvent): void {
    if (event.button === 0 && event.isPrimary) {
      this.passwordVisible = true;
    }
  }

  mostrarPasswordConTeclado(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.passwordVisible = true;
    }
  }

  ocultarPasswordConTeclado(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.ocultarPassword();
    }
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  @HostListener('window:blur')
  @HostListener('document:visibilitychange')
  ocultarPassword(): void {
    this.passwordVisible = false;
  }

  get username(): string {
    return String(this.user.userName || this.user.dni || this.user.docid || this.user.username || '');
  }

  get initialPassword(): string {
    return this.username ? `Cultural${this.username.substring(0, 4)}` : '';
  }

  ngOnInit(): void {
    this.cargarCuenta();
  }

  cargarCuenta(): void {
    if (this.loading) return;
    this.teamsEmail = '';
    this.errorMessage = '';
    if (!this.username) {
      this.errorMessage = 'No se pudo identificar tu usuario. Vuelve a iniciar sesión.';
      return;
    }
    this.loading = true;
    this.alumnoService.getPerfil(this.username).pipe(
      switchMap(perfil => perfil.id_teams
        ? this.alumnoService.obtenerCuentaTeams(perfil.id_teams)
        : of(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: cuenta => {
        this.teamsEmail = cuenta?.user?.mail || '';
        this.errorMessage = this.teamsEmail ? '' : 'Aún no tienes una cuenta de Teams disponible. Comunícate con El Cultural para recibir ayuda.';
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar tu cuenta de Teams. Intenta nuevamente.';
        this.loading = false;
      },
    });
  }

  async copiarTexto(texto: string): Promise<void> {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      this.snack.success('Texto copiado al portapapeles');
    } catch {
      this.snack.warning('No se pudo copiar. Selecciona el texto y cópialo manualmente.');
    }
  }
}

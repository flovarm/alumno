import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlumnoService } from '../services/alumno.service';
import { SnackService } from '../services/snack.service';
import { map, catchError, of } from 'rxjs';

export const perfilCompletoGuard: CanActivateFn = (route, state) => {
  const alumnoService = inject(AlumnoService);
  const router = inject(Router);
  const snackService = inject(SnackService);

  // Obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem('alumno_currentUser') || '{}');

  if (!user || !user.userName) {
    router.navigate(['/login']);
    return false;
  }

  // Obtener perfil del alumno
  return alumnoService.getPerfil(user.userName).pipe(
    map((perfil) => {
      // Validar campos requeridos
      const camposRequeridos = [
        { campo: 'nombre', nombre: 'Nombre' },
        { campo: 'apePaterno', nombre: 'Apellido Paterno' },
        { campo: 'direccion', nombre: 'Dirección' },
        { campo: 'email', nombre: 'Email' },
        { campo: 'seguro', nombre: 'Seguro' },
        { campo: 'brazoDominante', nombre: 'Brazo Dominante' },
        { campo: 'enteramiento', nombre: 'Enteramiento' },
      ];

      const camposFaltantes: string[] = [];

      for (const item of camposRequeridos) {
        const valor = perfil[item.campo];
        if (!valor || valor === '' || valor === null || valor === undefined) {
          camposFaltantes.push(item.nombre);
        }
      }

      // Verificar distrito - ahora el backend envía "distrito" con el ID
      const tieneDistrito = perfil.distrito && perfil.distrito.trim() !== '';
      if (!tieneDistrito) {
        camposFaltantes.push('Distrito');
      }

      // Verificar que tenga al menos un teléfono válido
      const telefonos = perfil.telefonos || [];
      const tieneTelefonoValido = telefonos.some(
        (t: any) =>
          t.numeroTfno &&
          t.numeroTfno.trim() !== '' &&
          t.personaTfno &&
          t.personaTfno.trim() !== '',
      );

      if (!tieneTelefonoValido) {
        camposFaltantes.push('Al menos un teléfono con persona asignada');
      }

      // Si hay campos faltantes, bloquear acceso
      if (camposFaltantes.length > 0) {
        snackService.warning(
          'Es necesario actualizar sus datos para poder registrar matrícula',
          { duration: 6000 },
        );
        router.navigate(['/home']);
        return false;
      }

      return true;
    }),
    catchError((error) => {
      console.error('Error al verificar el perfil:', error);
      snackService.danger('Error al verificar su perfil. Intente nuevamente.');
      router.navigate(['/home']);
      return of(false);
    }),
  );
};

import { Component, HostListener } from '@angular/core';
 // <-- Importa CommonModule
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  description?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatTooltipModule,
    MatIconModule
],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  isMobile = false;

  menuItems: MenuItem[] = [
    {
      icon: 'school',
      label: 'Historial Académico',
      route: '/historial-academico',
      description: 'Consulta tus calificaciones'
    },
    {
      icon: 'payment',
      label: 'Historial de Pagos',
      route: '/historial-pagos',
      description: 'Revisa tus pagos y estados de cuenta'
    },
    {
      icon: 'assignment',
      label: 'Registro de Matrícula',
      route: '/registro-matricula',
      description: 'Gestiona tu matrícula y horarios'
    },
    {
      icon: 'book',
      label: 'Compra de Libros',
      route: '/compra-libros',
      description: 'Adquiere libros y material académico'
    },
    {
      icon: 'money_off',
      label: 'Pago de Deuda',
      route: '/pago-deuda',
      description: 'Paga tus deudas pendientes'
    }
  ];

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  onToggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  onToggleCollapsed() {
    this.isSidenavCollapsed = !this.isSidenavCollapsed;
  }

  onNavItemClick(route: string) {
    this.router.navigate([route]);
    // if (this.isMobile) {
    //   this.isSidenavOpen = false;
    // }
  }

  onBackdropClick(): void {
    this.onToggleSidenav();
  }
}
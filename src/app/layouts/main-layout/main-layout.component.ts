import { Component, HostListener } from "@angular/core";
// <-- Importa CommonModule
import { RouterModule, RouterOutlet } from "@angular/router";
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: "./main-layout.component.html",
  styleUrl: "./main-layout.component.scss",
})
export class MainLayoutComponent {
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  isMobile = false;

  menuSections: MenuSection[] = [
    {
      label: 'Principal',
      items: [
        { icon: 'home', label: 'Inicio', route: '/home' },
        { icon: 'video_call', label: 'Clases virtuales', route: '/clases-virtuales' },
      ],
    },
    {
      label: 'Historial',
      items: [
        { icon: 'school', label: 'Historial académico', route: '/historial-academico' },
        { icon: 'payment', label: 'Historial de pagos', route: '/historial-pagos' },
      ],
    },
    {
      label: 'Pagos virtuales',
      items: [
        { icon: 'assignment', label: 'Registro de matrícula', route: '/registro-matricula' },
        { icon: 'book', label: 'Compra de libros', route: '/compra-libros' },
        { icon: 'quiz', label: 'Exámenes', route: '/examenes' },
        { icon: 'money_off', label: 'Pago de deuda', route: '/pago-deuda' },
      ],
    },
    {
      label: 'Actividades',
      items: [{ icon: 'event', label: 'Eventos', route: '/eventos' }],
    },
  ];



  constructor() {
    this.checkScreenSize();
  }

  @HostListener("window:resize", ["$event"])
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

  onNavItemClick() {
    if (this.isMobile) {
      this.isSidenavOpen = false;
    }
  }

  onBackdropClick(): void {
    this.onToggleSidenav();
  }
}

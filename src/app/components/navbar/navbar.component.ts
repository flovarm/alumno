import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../_services/theme.service';
import { AuthService } from '../../services/auth.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule, 
    RouterModule, 
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule, 
    MatBadgeModule, 
    MatTooltipModule,
  MatProgressBarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Output() toggleSidenavEvent = new EventEmitter<void>();
  notificationCount = 3;

  user = JSON.parse(localStorage.getItem('alumno_currentUser'));
  
  // Inyectar servicios
  public loadingService = inject(LoadingService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  profileMenuItems = [
    { label: 'Mi Perfil', route: '/profile', icon: 'person' },
    { label: 'Configuración', route: '/settings', icon: 'settings' },
    { label: 'Ayuda', route: '/help', icon: 'help' },
    { label: 'Cerrar Sesión', route: '/logout', icon: 'logout' }
  ];

  // Getter para el tema actual
  get currentTheme() {
    return this.themeService.selectedTheme();
  }
  
  // Getter para todos los temas disponibles
  get availableThemes() {
    return this.themeService.getThemes();
  }
  
  isDarkTheme(): boolean {
    const currentTheme = this.currentTheme?.name;
    if (currentTheme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return currentTheme === 'dark';
  }
  
  // Método para cambiar tema
  onThemeChange(themeName: 'light' | 'dark' | 'system') {
    this.themeService.setTheme(themeName);
  }

  onNotificationClick() {
    console.log('Notificaciones clickeadas');
    // Aquí puedes implementar la lógica de notificaciones
  }

  onProfileMenuClick(route: string) {
    if (route === '/logout') {
      this.logout();
    } else {
      console.log('Navegando a:', route);
      // Aquí puedes implementar la navegación o lógica específica para otras rutas
    }
  }

  logout() {
    // Usar AuthService para cerrar sesión (maneja limpieza y redirección)
    this.authService.logout();
  }

  onToggleMenu() {
    this.toggleSidenavEvent.emit();
  }

  get userInitials(): string {
    const nombreCompleto = this.user?.nombreCompleto || '';
    return nombreCompleto
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase())
      .join('')
      .slice(0, 2); // Solo dos iniciales
  }
}

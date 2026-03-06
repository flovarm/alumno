import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-boleta-electronica',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <!-- Vista de Pago Exitoso -->
    <div class="pago-exitoso-container">
      <mat-card class="success-card">
        <mat-card-header class="success-header">
          <div class="success-icon">
            <mat-icon class="checkmark-icon">check_circle</mat-icon>
          </div>
          <div class="success-content">
            <mat-card-title class="success-title">¡Pago Realizado Exitosamente!</mat-card-title>
            <mat-card-subtitle class="success-subtitle">
              Tu {{ esVentaLibro() ? 'compra de libro' : 'matrícula' }} ha sido procesada correctamente
            </mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content class="success-details">
          <div class="transaction-info">
            <div class="info-row">
              <span class="label">Número de Boleta:</span>
              <span class="value">{{ boletaData?.serie }}-{{ boletaData?.numero }}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha y Hora:</span>
              <span class="value">{{ boletaData?.fechaEmision | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Cliente:</span>
              <span class="value">{{ boletaData?.completo }}</span>
            </div>
            @if (esVentaLibro()) {
              <div class="info-row">
                <span class="label">Concepto:</span>
                <span class="value">{{ boletaData?.concepto }}</span>
              </div>
            } @else {
              <div class="info-row">
                <span class="label">Curso:</span>
                <span class="value">{{ boletaData?.curso }}</span>
              </div>
            }
            <div class="info-row total-row">
              <span class="label">Total Pagado:</span>
              <span class="value total-amount">S/ {{ boletaData?.total | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="success-message">
            <div class="message-box">
              <mat-icon class="message-icon">info</mat-icon>
              <div class="message-text">
                <p><strong>{{ esVentaLibro() ? '¡Tu libro ha sido adquirido!' : '¡Tu matrícula está confirmada!' }}</strong></p>
                <p>Hemos enviado la confirmación a tu correo electrónico.</p>
                <p>{{ esVentaLibro() ? 'Puedes recoger tu libro en nuestras instalaciones. Recuerda presentar el DNI del estudiante o comprobante de pago ' : '¡Éxitos en tus estudios!' }}</p>
                <p><strong>Horario de atención:</strong></p>
                <p>Lunes a viernes de 8am a 7.15pm  y sábado de 8am a 3.45pm</p>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions class="success-actions">
          <button mat-raised-button color="primary" (click)="imprimirTicket()">
            <mat-icon>print</mat-icon>
            Imprimir Comprobante
          </button>
          
          <button mat-raised-button color="accent" (click)="descargarPDF()">
            <mat-icon>download</mat-icon>
            Descargar PDF
          </button>
          
          <button mat-stroked-button (click)="volver()">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <!-- Hidden content for printing -->
    <div id="boleta-content" style="display: none;">
      <div class="boleta-header">
        <div class="company-info">
          <img src="https://elcultural.edu.pe/images/asset6.png" alt="Logo" class="company-logo">
          <div class="company-details">
            <h1>Centro Peruano Americano El Cultural</h1>
            <p>RUC: 20132111082</p>
            <p>Av. Venezuela 128 - Trujillo - La Libertad</p>
            <p>Teléfono: (044) 231512</p>
          </div>
        </div>
        <div class="document-info">
          <div class="document-type">
            <h2>BOLETA DE VENTA ELECTRÓNICA</h2>
            <div class="document-number">
              {{ boletaData?.serie }}-{{ boletaData?.numero }}
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="client-info">
        <h3>DATOS DEL CLIENTE</h3>
        <div class="client-grid">
          <div class="client-item">
            <strong>Código:</strong> {{ boletaData?.codigo }}
          </div>
          <div class="client-item">
            <strong>DNI:</strong> {{ boletaData?.docId }}
          </div>
          <div class="client-item full-width">
            <strong>Nombre Completo:</strong> {{ boletaData?.completo }}
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="course-info">
        <h3>DATOS DEL SERVICIO</h3>
        <div class="course-grid">
          @if (esVentaLibro()) {
            <div class="course-item full-width">
              <strong>Tipo:</strong> Venta de Libro
            </div>
            @if (boletaData?.nombreLibro) {
              <div class="course-item full-width">
                <strong>Libro:</strong> {{ boletaData?.nombreLibro }}
              </div>
            }
          } @else {
            <div class="course-item">
              <strong>Periodo:</strong> {{ boletaData?.periodo }}
            </div>
            <div class="course-item">
              <strong>Curso:</strong> {{ boletaData?.curso }}
            </div>
            <div class="course-item">
              <strong>Turno:</strong> {{ boletaData?.turno }}
            </div>
            <div class="course-item">
              <strong>Aula:</strong> {{ boletaData?.aula }}
            </div>
            <div class="course-item">
              <strong>Profesor:</strong> {{ boletaData?.profesor }}
            </div>
          }
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="service-details">
        <table class="service-table">
          <thead>
            <tr>
              <th>DESCRIPCIÓN</th>
              <th>CANTIDAD</th>
              <th>PRECIO UNIT.</th>
              <th>DESCUENTO</th>
              <th>IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {{ boletaData?.concepto }} -
                @if (esVentaLibro()) {
                  {{ boletaData?.nombreLibro || 'Libro' }}
                } @else {
                  {{ boletaData?.curso }}
                }
              </td>
              <td>1</td>
              <td>S/ {{ boletaData?.costo | number:'1.2-2' }}</td>
              <td>S/ {{ boletaData?.descuento | number:'1.2-2' }}</td>
              <td>S/ {{ boletaData?.costo | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals-section">
        <div class="totals-grid">
          <div class="total-row">
            <span class="total-label">Sub Total:</span>
            <span class="total-value">S/ {{ boletaData?.costo | number:'1.2-2' }}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Descuento:</span>
            <span class="total-value">S/ {{ boletaData?.descuento | number:'1.2-2' }}</span>
          </div>
          <div class="total-row">
            <span class="total-label">IGV (0%):</span>
            <span class="total-value">S/ 0.00</span>
          </div>
          <div class="total-row final-total">
            <span class="total-label">MONTO CANCELADO:</span>
            <span class="total-value">S/ {{ boletaData?.total | number:'1.2-2' }}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Deuda:</span>
            <span class="total-value">S/ {{ boletaData?.deuda | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <div class="footer-info">
        <div class="emission-date">
          <strong>Fecha de Emisión:</strong> {{ boletaData?.fechaEmision | date:'dd/MM/yyyy HH:mm' }}
        </div>
        <div class="footer-text">
          <p>Gracias por su preferencia</p>
          <p>¡Éxito en sus estudios!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --success-bg: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      --card-bg: #ffffff;
      --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      --header-bg: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --info-bg: #f8fafc;
      --info-border: #e2e8f0;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --message-bg: #eff6ff;
      --message-border: #bfdbfe;
      --message-text: #1e40af;
      --message-icon: #3b82f6;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --success-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        --card-bg: #1f2937;
        --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        --header-bg: linear-gradient(135deg, #047857 0%, #065f46 100%);
        --info-bg: #374151;
        --info-border: #4b5563;
        --text-primary: #f1f5f9;
        --text-secondary: #94a3b8;
        --message-bg: #1e3a8a;
        --message-border: #3b82f6;
        --message-text: #dbeafe;
        --message-icon: #60a5fa;
      }
    }

    .pago-exitoso-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
      background: var(--success-bg);
    }

    .success-card {
      max-width: 600px;
      width: 100%;
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
      animation: slideIn .6s ease-out;
      background: var(--card-bg);
      border: 1px solid transparent;
    }

    @media (prefers-color-scheme: dark) {
      .success-card {
        border-color: #374151;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .success-header {
      background: var(--header-bg);
      color: #fff;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .checkmark-icon {
      font-size: 4rem;
      color: #fff;
      animation: checkmark .8s ease-in-out .3s both;
    }

    @keyframes checkmark {
      0% {
        transform: scale(0) rotate(45deg);
        opacity: 0;
      }
      50% {
        transform: scale(1.2) rotate(45deg);
        opacity: 1;
      }
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    }

    .success-content {
      flex: 1;
    }

    .success-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 .5rem;
      color: #fff;
    }

    .success-subtitle {
      font-size: 1.1rem;
      opacity: .9;
      margin: 0;
      color: #fff;
    }

    .success-details {
      padding: 2rem;
    }

    .transaction-info {
      background: var(--info-bg);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-left: 4px solid #10b981;
    }

    @media (prefers-color-scheme: dark) {
      .transaction-info {
        border-left-color: #059669;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--info-border);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row.total-row {
      border-top: 2px solid #10b981;
      margin-top: 1rem;
      padding-top: 1rem;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .value {
      color: var(--text-primary);
      font-weight: 600;
      text-align: right;
    }

    .total-amount {
      color: #10b981;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .success-message {
      margin-bottom: 2rem;
    }

    .message-box {
      background: var(--message-bg);
      border: 1px solid var(--message-border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .message-icon {
      color: var(--message-icon);
      font-size: 1.5rem;
      margin-top: 0.25rem;
    }

    .message-text {
      flex: 1;
    }

    .message-text p {
      margin: 0 0 0.5rem 0;
      color: var(--message-text);
      line-height: 1.5;
    }

    .message-text p:last-child {
      margin-bottom: 0;
    }

    .success-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 1.5rem 2rem 2rem 2rem;
      flex-wrap: wrap;
    }

    .success-actions button {
      min-width: 160px;
    }

    #boleta-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
      color: black !important;
    }

    #boleta-content * {
      color: black !important;
    }

    .boleta-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .company-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .company-logo {
      width: 80px;
      height: auto;
    }

    .company-details h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: bold;
      color: black !important;
    }

    .company-details p {
      margin: 0.2rem 0;
      font-size: 0.9rem;
      color: black !important;
    }

    .document-info {
      text-align: center;
      border: 2px solid black;
      padding: 1rem;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .document-type h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
      color: black !important;
    }

    .document-number {
      font-size: 1.1rem;
      font-weight: bold;
      color: black !important;
    }

    .client-info, .course-info {
      margin: 1.5rem 0;
    }

    .client-info h3, .course-info h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: black !important;
      border-bottom: 2px solid black;
      padding-bottom: 0.5rem;
    }

    .client-grid, .course-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    
    .course-item:last-child {
      grid-column: 1 / -1;
    }

    .client-item.full-width {
      grid-column: 1 / -1;
    }

    .client-item, .course-item {
      padding: 0.5rem 0;
    }

    .service-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    .service-table th,
    .service-table td {
      border: 1px solid #000;
      padding: 0.75rem;
      text-align: left;
      color: black !important;
    }

    .service-table th {
      background-color: #f5f5f5;
      font-weight: bold;
      text-align: center;
      color: black !important;
    }

    .service-table td:nth-child(2),
    .service-table td:nth-child(3),
    .service-table td:nth-child(4),
    .service-table td:nth-child(5) {
      text-align: center;
    }

    .totals-section {
      margin-top: 2rem;
    }

    .totals-grid {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      max-width: 300px;
      margin-left: auto;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 0.25rem 0;
      border-bottom: 1px solid #eee;
    }

    .total-row.final-total {
      border-top: 2px solid black;
      border-bottom: 2px solid black;
      font-weight: bold;
      font-size: 1.1rem;
      margin-top: 0.5rem;
      padding: 0.5rem 0;
      background: #f8f9fa;
    }

    .total-label {
      font-weight: 500;
      color: black !important;
    }

    .total-value {
      font-weight: bold;
      min-width: 100px;
      text-align: right;
      color: black !important;
    }

    .footer-info {
      margin-top: 2rem;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 1rem;
    }

    .emission-date {
      margin-bottom: 1rem;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .footer-text p {
      margin: 0.5rem 0;
      font-style: italic;
      color: black !important;
    }

    @media (max-width: 768px) {
      .pago-exitoso-container {
        padding: 1rem;
        min-height: calc(100vh - 150px);
      }

      .success-header {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem;
        gap: 1rem;
      }

      .success-title {
        font-size: 1.5rem;
      }

      .success-subtitle {
        font-size: 1rem;
      }

      .success-details {
        padding: 1.5rem;
      }

      .success-actions {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      .success-actions button {
        width: 100%;
        max-width: 300px;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .value {
        text-align: left;
        font-weight: 700;
      }

      .boleta-header {
        flex-direction: column;
        gap: 1rem;
      }

      .company-info {
        flex-direction: column;
        text-align: center;
      }

      .client-grid, .course-grid {
        grid-template-columns: 1fr;
      }

      .service-table {
        font-size: 0.8rem;
      }
    }

    @media (prefers-color-scheme: dark) {
      #boleta-content {
        background: white !important;
        color: black !important;
      }

      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #374151;
      }

      ::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      .mat-mdc-raised-button.mat-primary {
        --mdc-filled-button-container-color: #10b981;
      }

      .mat-mdc-raised-button.mat-accent {
        --mdc-filled-button-container-color: #059669;
      }

      .mat-divider {
        border-top-color: #4b5563;
      }
    }

    .success-details {
      background: var(--card-bg);
      color: var(--text-primary);
    }

    .success-actions {
      background: var(--card-bg);
    }

    :host-context(.light-theme),
    :host-context(.light) {
      --success-bg: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      --card-bg: #ffffff;
      --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      --header-bg: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --info-bg: #f8fafc;
      --info-border: #e2e8f0;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --message-bg: #eff6ff;
      --message-border: #bfdbfe;
      --message-text: #1e40af;
      --message-icon: #3b82f6;
    }

    :host-context(.dark-theme),
    :host-context(.dark) {
      --success-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      --card-bg: #1f2937;
      --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      --header-bg: linear-gradient(135deg, #047857 0%, #065f46 100%);
      --info-bg: #374151;
      --info-border: #4b5563;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --message-bg: #1e3a8a;
      --message-border: #3b82f6;
      --message-text: #dbeafe;
      --message-icon: #60a5fa;
    }

    :host-context(.light-theme) .success-card,
    :host-context(.light) .success-card {
      border-color: transparent;
    }

    :host-context(.dark-theme) .success-card,
    :host-context(.dark) .success-card {
      border-color: #374151;
    }

    :host-context(.light-theme) .transaction-info,
    :host-context(.light) .transaction-info {
      border-left-color: #10b981;
    }

    :host-context(.dark-theme) .transaction-info,
    :host-context(.dark) .transaction-info {
      border-left-color: #059669;
    }
  `]
})
export class BoletaElectronicaComponent implements OnInit {
  boletaData: any = null;
  private router = inject(Router);
  private location = inject(Location);

  ngOnInit() {
    // Obtener datos del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    
    if (navigation?.extras.state) {
      this.boletaData = navigation.extras.state;
    } else {
      // Intentar obtener desde history.state como fallback
      if (history.state && Object.keys(history.state).length > 0) {
        this.boletaData = history.state;
      } else {
        console.warn('No se encontraron datos de la boleta');
        // Datos de prueba para debugging
        this.boletaData = {
          serie: 'B012',
          numero: '00000001',
          fechaEmision: new Date(),
          codigo: 'A001',
          docId: '12345678',
          completo: 'Juan Pérez García',
          curso: 'Inglés Básico I',
          aula: 'A-101',
          profesor: 'María García',
          periodo: '2024-I',
          concepto: 'Matrícula',
          costo: 200.00,
          descuento: 50.00,
          deuda: 0.00,
          total: 150.00
        };
      }
    }
  }

  esVentaLibro(): boolean {
    const concepto = this.boletaData?.concepto || '';
    return concepto.toLowerCase().includes('venta') || concepto.toLowerCase().startsWith('venta');
  }

  imprimirTicket() {
    // Directamente imprimir en formato ticket
    this.imprimirFormatoTicket();
  }

  imprimirBoleta() {
    this.abrirModalImpresion();
  }

  abrirModalImpresion() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    `;

    modalContent.innerHTML = `
      <h3>Seleccionar tipo de impresión</h3>
      <div style="margin: 2rem 0;">
        <button id="impresion-normal" style="
          background: #002b73;
          color: white;
          border: none;
          padding: 1rem 2rem;
          margin: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        ">
          📄 Impresión Normal (A4)
        </button>
        
        <button id="impresion-ticket" style="
          background: #002b73;
          color: white;
          border: none;
          padding: 1rem 2rem;
          margin: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        ">
          🎫 Impresión Ticket (Térmica)
        </button>
        
        <button id="cerrar-modal" style="
          background: #757575;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          margin-top: 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">
          Cancelar
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('impresion-normal')?.addEventListener('click', () => {
      this.imprimirFormatoNormal();
      document.body.removeChild(modal);
    });

    document.getElementById('impresion-ticket')?.addEventListener('click', () => {
      this.imprimirFormatoTicket();
      document.body.removeChild(modal);
    });

    document.getElementById('cerrar-modal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  imprimirFormatoNormal() {
    const printContent = document.getElementById('boleta-content');
    if (!printContent) return;

    const servicioContentNormal = this.esVentaLibro()
      ? `<div class="course-grid">
           <div class="course-item full-width">
             <strong>Tipo:</strong> Venta de Libro
           </div>
           ${this.boletaData?.nombreLibro ? `<div class="course-item full-width"><strong>Libro:</strong> ${this.boletaData.nombreLibro}</div>` : ''}
         </div>`
      : `<div class="course-grid">
           <div class="course-item"><strong>Periodo:</strong> ${this.boletaData?.periodo || 'N/A'}</div>
           <div class="course-item"><strong>Curso:</strong> ${this.boletaData?.curso || 'N/A'}</div>
           <div class="course-item"><strong>Turno:</strong> ${this.boletaData?.turno || 'N/A'}</div>
           <div class="course-item"><strong>Aula:</strong> ${this.boletaData?.aula || 'N/A'}</div>
           <div class="course-item"><strong>Profesor:</strong> ${this.boletaData?.profesor || 'N/A'}</div>
         </div>`;

    const WindowPrt = window.open('', '', 'width=900,height=650,scrollbars=yes,resizable=yes');
    if (!WindowPrt) return;

    // Modify the HTML content to include conditional service info
    let htmlContent = printContent.innerHTML;
    const courseInfoRegex = /<div class="course-info">[\s\S]*?<\/div>/;
    const newCourseInfo = `
      <div class="course-info">
        <h3>DATOS DEL SERVICIO</h3>
        ${servicioContentNormal}
      </div>
    `;
    htmlContent = htmlContent.replace(courseInfoRegex, newCourseInfo);

    WindowPrt.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boleta Electrónica</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            background: white;
            color: black !important;
            line-height: 1.4;
          }
          
          * {
            color: black !important;
          }

          .boleta-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            background: white;
            color: black;
          }

          .boleta-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #ddd;
          }

          .company-info {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }

          .company-logo {
            width: 80px;
            height: auto;
          }

          .company-details h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: bold;
            color: black !important;
          }

          .company-details p {
            margin: 0.2rem 0;
            font-size: 0.9rem;
            color: black !important;
          }

          .document-info {
            text-align: center;
            border: 2px solid black;
            padding: 1rem;
            border-radius: 8px;
            background: #f8f9fa;
          }

          .document-type h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
            color: black !important;
          }

          .document-number {
            font-size: 1.1rem;
            font-weight: bold;
            color: black !important;
          }

          .client-info, .course-info {
            margin: 1.5rem 0;
          }

          .client-info h3, .course-info h3 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: black !important;
            border-bottom: 2px solid black;
            padding-bottom: 0.5rem;
          }

          .client-grid, .course-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          
          .course-item:last-child {
            grid-column: 1 / -1;
          }

          .client-item.full-width {
            grid-column: 1 / -1;
          }

          .client-item, .course-item {
            padding: 0.5rem 0;
          }

          .service-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }

          .service-table th,
          .service-table td {
            border: 1px solid #000;
            padding: 0.75rem;
            text-align: left;
            color: black !important;
          }

          .service-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            color: black !important;
          }

          .service-table td:nth-child(2),
          .service-table td:nth-child(3),
          .service-table td:nth-child(4),
          .service-table td:nth-child(5) {
            text-align: center;
          }

          .totals-section {
            margin-top: 2rem;
          }

          .totals-grid {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            max-width: 300px;
            margin-left: auto;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding: 0.25rem 0;
            border-bottom: 1px solid #eee;
          }

          .total-row.final-total {
            border-top: 2px solid black;
            border-bottom: 2px solid black;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 0.5rem;
            padding: 0.5rem 0;
            background: #f8f9fa;
          }

          .total-label {
            font-weight: 500;
            color: black !important;
          }

          .total-value {
            font-weight: bold;
            min-width: 100px;
            text-align: right;
            color: black !important;
          }

          .footer-info {
            margin-top: 2rem;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }

          .emission-date {
            margin-bottom: 1rem;
            font-size: 0.9rem;
            font-weight: bold;
          }

          .footer-text p {
            margin: 0.5rem 0;
            font-style: italic;
            color: black !important;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .boleta-container {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${htmlContent}
      </body>
      </html>
    `);

    WindowPrt.document.close();
  }

  imprimirFormatoTicket() {
    const WindowPrt = window.open('', '', 'width=300,height=600,scrollbars=yes,resizable=yes');
    if (!WindowPrt) return;

    const ticketContent = this.generarContenidoTicket();

    WindowPrt.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - Boleta Electrónica</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            line-height: 1.3;
            margin: 0;
            padding: 5mm;
            width: 75mm;
            background: white;
            color: black;
          }
          
          .ticket-container {
            width: 100%;
          }
          
          .center {
            text-align: center;
          }
          
          .bold {
            font-weight: bold;
          }
          
          .small {
            font-size: 14px;
          }
          
          .separator {
            border-top: 1px dashed #000;
            margin: 5px 0;
            width: 100%;
          }
          
          .double-separator {
            border-top: 2px solid #000;
            margin: 8px 0;
            width: 100%;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          
          .logo {
            width: 40mm;
            height: auto;
            margin: 0 auto 5px auto;
            display: block;
          }
          
          .no-wrap {
            white-space: nowrap;
            overflow: hidden;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${ticketContent}
      </body>
      </html>
    `);

    WindowPrt.document.close();
  }

  generarContenidoTicket(): string {
    const fecha = new Date(this.boletaData?.fechaEmision || new Date());
    const fechaFormateada = fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const fechaInicio = new Date(this.boletaData?.fechaInicio || new Date());
    const fechaInicioFormateada = fechaInicio.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const servicioContent = this.esVentaLibro() 
      ? `<div class="small">Tipo: Venta de Libro</div>
         ${this.boletaData?.nombreLibro ? `<div class="small">Libro: ${this.boletaData.nombreLibro}</div>` : ''}`
      : `<div class="small">Periodo: ${this.boletaData?.periodo || 'N/A'}</div>
         <div class="small">Curso: ${this.boletaData?.curso || 'N/A'}</div>
         <div class="small">Aula: ${this.boletaData?.aula || 'N/A'}</div>
         <div class="small">Turno: ${this.boletaData?.turno || 'N/A'}</div>
         <div class="small">Prof: ${this.boletaData?.profesor || 'N/A'}</div>
          <div class="small">Fecha Inicio: ${fechaInicioFormateada || 'N/A'}</div>`;
    const descripcionServicio = this.esVentaLibro()
      ? `${this.boletaData?.concepto || 'Venta'} - ${this.boletaData?.nombreLibro || 'Libro'}`
      : `${this.boletaData?.concepto || 'Matrícula'} - ${this.boletaData?.curso || 'Curso'}`;

    return `
      <div class="ticket-container">
        <div class="center">
          <img src="https://elcultural.edu.pe/images/asset6.png" alt="Logo" class="logo">
          <div class="bold">Centro Peruano Americano</div>
          <div class="bold">El Cultural</div>
          <div class="small">RUC: 20132111082</div>
          <div class="small">Av. Venezuela 128 - Trujillo</div>
          <div class="small">Tel: (044) 231512</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="center bold">
          BOLETA DE VENTA ELECTRONICA
        </div>
        <div class="center bold">
          ${this.boletaData?.serie || 'B012'}-${this.boletaData?.numero || '00000001'}
        </div>
        
        <div class="separator"></div>
        
        <div><strong>CLIENTE:</strong></div>
        <div class="small">Cod: ${this.boletaData?.codigo || 'N/A'}</div>
        <div class="small">DNI: ${this.boletaData?.docId || 'N/A'}</div>
        <div class="small no-wrap">${this.boletaData?.completo || 'Cliente'}</div>
        
        <div class="separator"></div>
        
        <div><strong>SERVICIO:</strong></div>
        ${servicioContent}
        
        <div class="separator"></div>
        
        <div><strong>DETALLE:</strong></div>
        <div class="small">${descripcionServicio}</div>
        <div class="row">
          <span>Cant: 1</span>
          <span>P.Unit: S/${(this.boletaData?.costo || 0).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Descuento:</span>
          <span>S/${(this.boletaData?.descuento || 0).toFixed(2)}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="row">
          <span>Monto Total:</span>
          <span>S/${(this.boletaData?.costo || 0).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Descuento:</span>
          <span>S/${(this.boletaData?.descuento || 0).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>IGV (0%):</span>
          <span>S/0.00</span>
        </div>
        
        <div class="double-separator"></div>
        
        <div class="row bold">
          <span>MONTO CANCELADO:</span>
          <span>S/${(this.boletaData?.total || 0).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Deuda:</span>
          <span>S/${(this.boletaData?.deuda || 0).toFixed(2)}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="center small">
          Fecha: ${fechaFormateada}
        </div>
        
        <div class="separator"></div>
        
        <div class="center small">
          Gracias por su preferencia
        </div>
        <div class="center small">
          ¡Éxito en sus estudios!
        </div>
        
        <div style="height: 10mm;"></div>
      </div>
    `;
  }

  descargarPDF() {
    // Implementar descarga como PDF usando html2pdf o similar
    const element = document.getElementById('boleta-content');
    if (element) {
      // Aquí puedes integrar una librería como html2pdf.js
      // Por ahora, usar print como alternativa
      this.imprimirBoleta();
    }
  }

  volver() {
    // Navegar al home en lugar de volver atrás
    this.router.navigate(['/home']);
  }
}

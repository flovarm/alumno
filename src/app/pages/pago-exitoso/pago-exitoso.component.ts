import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { Router, ActivatedRoute } from "@angular/router";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BoletaElectronicaResponse,
  DocumentoService,
} from "../../services/documento.service";

@Component({
  selector: "app-pago-exitoso",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    <!-- Loading State -->
    @if (isLoading) {
      <div class="loading-container">
        <mat-card class="loading-card">
          <mat-card-content>
            <div class="loading-content">
              <mat-icon class="loading-icon">refresh</mat-icon>
              <p>Cargando boleta electrónica...</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Error State -->
    @if (error && !isLoading) {
      <div class="error-container">
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon class="error-icon">error</mat-icon>
              <p>{{ error }}</p>
              <button
                mat-raised-button
                color="primary"
                (click)="volverAlInicio()"
              >
                Volver al Inicio
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Vista de Pago Exitoso -->
    @if (boletaData && !isLoading) {
      <div class="pago-exitoso-container">
        <mat-card class="success-card">
          <div class="success-header">
            <div class="success-icon">
              <mat-icon class="checkmark-icon">check_circle</mat-icon>
            </div>
            <div class="success-content">
              <mat-card-title class="success-title">{{
                getTituloDocumento()
              }}</mat-card-title>
              <mat-card-subtitle class="success-subtitle">
                {{
                  esVentaLibro()
                    ? "compra de libro"
                    : getTipoDocumento().toLowerCase()
                }}
                ha sido procesada correctamente
              </mat-card-subtitle>
            </div>
          </div>

          <mat-card-content class="success-details">
            <div class="transaction-info">
              <div class="info-row">
                <span class="label">Número de {{ getTipoDocumento() }}:</span>
                <span class="value"
                  >{{ boletaData?.serie }}-{{ boletaData?.numero }}</span
                >
              </div>
              @if (boletaData?.purchaseNumber) {
                <div class="info-row">
                  <span class="label">Número de pedido:</span>
                  <span class="value">{{ boletaData?.purchaseNumber }}</span>
                </div>
              }
              @if (boletaData?.transactionDate) {
                <div class="info-row">
                  <span class="label">Fecha y hora del pedido:</span>
                  <span class="value">{{ formatearFechaPago(boletaData.transactionDate) }}</span>
                </div>
              }
              @if (boletaData?.amount) {
                <div class="info-row">
                  <span class="label">Importe de la transacción:</span>
                  <span class="value">{{ formatearImportePago() }}</span>
                </div>
              }
              @if (boletaData.currency) {
                <div class="info-row">
                  <span class="label">Tipo de moneda:</span>
                  <span class="value">{{ boletaData.currency }}</span>
                </div>
              }
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
                <span class="value total-amount"
                  >S/ {{ boletaData?.total | number: "1.2-2" }}</span
                >
              </div>
            </div>

            <div class="success-message">
              <div class="message-box">
                <mat-icon class="message-icon">info</mat-icon>
                <div class="message-text">
                  <p>
                    <strong>{{
                      esVentaLibro()
                        ? "¡Tu libro ha sido adquirido!"
                        : "¡Tu matrícula está confirmada!"
                    }}</strong>
                  </p>
                  <p>Hemos enviado la confirmación a tu correo electrónico.</p>
                  <p>
                    {{
                      esVentaLibro()
                        ? "Puedes recoger tu libro en nuestras instalaciones. Recuerda presentar el DNI del estudiante o comprobante de pago "
                        : "¡Éxitos en tus estudios!"
                    }}
                  </p>
                  <p><strong>Horario de atención:</strong></p>
                  <p>
                    Lunes a viernes de 8am a 7.15pm y sábado de 8am a 3.45pm
                  </p>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="success-actions">
            <button
              mat-raised-button
              color="primary"
              (click)="imprimirTicket()"
            >
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
            <img
              src="https://elcultural.edu.pe/images/navbarLogo.png"
              alt="Logo"
              class="company-logo"
            />
            <div class="company-details">
              <h1>Centro Peruano Americano El Cultural</h1>
              <p>RUC: 20132111082</p>
              <p>Av. Venezuela 128 - Trujillo - La Libertad</p>
              <p>Teléfono: (044) 231512</p>
            </div>
          </div>
          <div class="document-info">
            <div class="document-type">
              <h2>{{ getTipoDocumento() }} DE VENTA ELECTRÓNICA</h2>
              <div class="document-number">
                {{ boletaData?.serie }}-{{ boletaData?.numero }}
              </div>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="client-info">
          <h3>DATOS DE LA TRANSACCIÓN</h3>
          <div class="client-grid">
            @if (boletaData?.transactionDate) {
              <div class="client-item"><strong>Fecha y hora:</strong> {{ formatearFechaPago(boletaData?.transactionDate) }}</div>
            }
            @if (boletaData?.amount) {
              <div class="client-item"><strong>Importe:</strong> {{ formatearImportePago() }}</div>
            }
            @if (boletaData.currency) {
              <div class="client-item"><strong>Moneda:</strong> {{ boletaData.currency }}</div>
            }
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
                <th>IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{ boletaData?.concepto }} -
                  @if (esVentaLibro()) {
                    {{ boletaData?.nombreLibro || "Libro" }}
                  } @else {
                    {{ boletaData?.curso }}
                  }
                </td>
                <td>1</td>
                <td>S/ {{ boletaData?.costo | number: "1.2-2" }}</td>
                <td>S/ {{ boletaData?.total | number: "1.2-2" }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="totals-section">
          <div class="totals-grid">
            <div class="total-row">
              <span class="total-label">Sub Total:</span>
              <span class="total-value"
                >S/ {{ boletaData?.costo | number: "1.2-2" }}</span
              >
            </div>
            <div class="total-row">
              <span class="total-label">IGV (0%):</span>
              <span class="total-value">S/ 0.00</span>
            </div>
            <div class="total-row final-total">
              <span class="total-label">MONTO CANCELADO:</span>
              <span class="total-value"
                >S/ {{ boletaData?.total | number: "1.2-2" }}</span
              >
            </div>
            <div class="total-row">
              <span class="total-label">Deuda:</span>
              <span class="total-value"
                >S/ {{ boletaData?.deuda | number: "1.2-2" }}</span
              >
            </div>
          </div>
        </div>

        <div class="footer-info">
          <div class="emission-date">
            <strong>Fecha de Emisión:</strong>
            {{ boletaData?.fechaEmision | date: "dd/MM/yyyy HH:mm" }}
          </div>
          <div class="footer-text">
            <p>Gracias por su preferencia</p>
            <p>¡Éxito en sus estudios!</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .loading-container,
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 2rem;
      }

      .loading-card,
      .error-card {
        max-width: 400px;
        width: 100%;
        text-align: center;
      }

      .loading-content,
      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .loading-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: var(--md-primary);
        animation: spin 2s linear infinite;
      }

      .error-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: var(--md-error);
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      :host {
        --md-primary: var(--sys-primary);
        --md-on-primary: var(--sys-on-primary);
        --md-primary-container: var(--sys-primary-container);
        --md-on-primary-container: var(--sys-on-primary-container);
        --md-secondary: var(--sys-secondary);
        --md-on-secondary: var(--sys-on-secondary);
        --md-secondary-container: var(--sys-secondary-container);
        --md-on-secondary-container: var(--sys-on-secondary-container);
        --md-tertiary: var(--sys-tertiary);
        --md-on-tertiary: var(--sys-on-tertiary);
        --md-tertiary-container: var(--sys-tertiary-container);
        --md-on-tertiary-container: var(--sys-on-tertiary-container);
        --md-surface: var(--sys-surface);
        --md-surface-dim: var(--sys-surface-dim);
        --md-surface-bright: var(--sys-surface-bright);
        --md-surface-container: var(--sys-surface-container);
        --md-surface-container-low: var(--sys-surface-container-low);
        --md-surface-container-high: var(--sys-surface-container-high);
        --md-surface-container-highest: var(--sys-surface-container-highest);
        --md-surface-variant: var(--sys-surface-variant);
        --md-outline: var(--sys-outline);
        --md-outline-variant: var(--sys-outline-variant);
        --md-on-surface: var(--sys-on-surface);
        --md-on-surface-variant: var(--sys-on-surface-variant);
        --md-inverse-surface: var(--sys-inverse-surface);
        --md-inverse-on-surface: var(--sys-inverse-on-surface);
        --md-inverse-primary: var(--sys-inverse-primary);
        --md-error: var(--sys-error);
        --md-on-error: var(--sys-on-error);
        --md-error-container: var(--sys-error-container);
        --md-on-error-container: var(--sys-on-error-container);
        --success-bg: linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-primary-container) 45%, white) 0%,
          color-mix(in srgb, var(--md-surface-container) 70%, white) 100%
        );
        --card-bg: var(--md-surface);
        --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        --header-bg: linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-primary) 92%, black) 0%,
          var(--md-primary) 100%
        );
        --info-bg: var(--md-surface-container);
        --info-border: var(--md-outline-variant);
        --text-primary: var(--md-on-surface);
        --text-secondary: var(--md-on-surface-variant);
        --message-bg: color-mix(
          in srgb,
          var(--md-primary-container) 65%,
          var(--md-surface) 35%
        );
        --message-border: var(--md-outline-variant);
        --message-text: var(--md-on-primary-container);
        --message-icon: var(--md-primary);
      }

      .pago-exitoso-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 200px);
        padding: 2rem;
      }

      .success-card {
        max-width: 600px;
        width: 100%;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        overflow: hidden;
        animation: slideIn 0.6s ease-out;
        background: var(--mat-bg-secondary-container);
        border: 1px solid transparent;
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
        background: transparent;
        color: var(--md-primary);
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border-bottom: 1px solid var(--md-outline-variant);
      }

      .success-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .checkmark-icon {
        font-size: 4rem;
        color: var(--md-primary);
        animation: checkmark 0.8s ease-in-out 0.3s both;
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
        margin: 0 0 0.5rem;
        color: var(--mat-sys-primary);
      }

      .success-subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
        margin: 0;
        color: var(--mat-sys-primary);
      }

      .success-details {
        padding: 2rem;
      }

      .transaction-info {
        background: var(--mat-sys-tertary);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
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
        border-top: 2px solid var(--mat-sys-primary);
        margin-top: 1rem;
        padding-top: 1rem;
        font-weight: 600;
        font-size: 1.1rem;
      }

      .label {
        color: var(--mat-sys-on-surface-variant);
        font-weight: 500;
      }

      .value {
        color: var(--text-primary);
        font-weight: 600;
        text-align: right;
      }

      .total-amount {
        color: var(--mat-sys-primary);
        font-size: 1.25rem;
        font-weight: 700;
      }

      .success-message {
        margin-bottom: 2rem;
      }

      .message-box {
        background: var(--mat-sys-primary-container);
        border: 1px solid var(--message-border);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }

      .message-icon {
        color: var(--mat-sys-prinmary);
        font-size: 1.5rem;
        margin-top: 0.25rem;
      }

      .message-text {
        flex: 1;
      }

      .message-text p {
        margin: 0 0 0.5rem 0;
        color: var(--mat-sys-on-primary-container);
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

      .client-info,
      .course-info {
        margin: 1.5rem 0;
      }

      .client-info h3,
      .course-info h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: black !important;
        border-bottom: 2px solid black;
        padding-bottom: 0.5rem;
      }

      .client-grid,
      .course-grid {
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

      .client-item,
      .course-item {
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

        .client-grid,
        .course-grid {
          grid-template-columns: 1fr;
        }

        .service-table {
          font-size: 0.8rem;
        }
      }

      @media (prefers-color-scheme: dark) {
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

        .mat-divider {
          border-top-color: var(--md-outline-variant);
        }
      }

      .success-details {
        background: var(--card-bg);
        color: var(--text-primary);
      }

      .success-actions {
        background: var(--card-bg);
      }

      .success-card {
        border-color: var(--md-outline-variant);
      }

      /* Resultado del pago: estilos de pantalla, sin alterar el comprobante. */
      .pago-exitoso-container { display: block; max-width: 840px; margin: 0 auto; padding: 32px 24px; min-height: 0; }
      .success-card { width: 100%; max-width: none; border-radius: 20px; border: 1px solid var(--mat-sys-outline-variant); box-shadow: none; animation: none; background: var(--mat-sys-surface-container-low); overflow: hidden; }
      .success-header { display: flex; align-items: center; gap: 16px; padding: 28px; background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); border-bottom: 1px solid var(--mat-sys-outline-variant); }
      .success-header .success-content { display: block; text-align: left; min-width: 0; }
      .success-header mat-icon { width: 48px; height: 48px; font-size: 48px; color: var(--mat-sys-primary); animation: none; }
      .success-header > div:first-child { flex-shrink: 0; }
      .success-title { color: var(--mat-sys-on-primary-container); font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 0; }
      .success-subtitle { color: var(--mat-sys-on-primary-container); font-size: 0.95rem; line-height: 1.5; margin-top: 8px; opacity: 1; }
      .success-details { padding: 24px; }
      .success-card .transaction-info { padding: 0; margin: 0; border: 1px solid var(--mat-sys-outline-variant); border-radius: 14px; background: var(--mat-sys-surface); overflow: hidden; }
      .success-card .info-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 16px; padding: 14px 18px; margin: 0; border-bottom: 1px solid var(--mat-sys-outline-variant); }
      .success-card .info-row:last-child { border-bottom: 0; }
      .success-card .label { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; font-weight: 500; }
      .success-card .value { color: var(--mat-sys-on-surface); font-size: 0.95rem; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
      .success-card .total-row { background: var(--mat-sys-primary-container); border-top: 0; }
      .success-card .total-row .label { color: var(--mat-sys-on-primary-container); align-self: center; }
      .success-card .total-amount { color: var(--mat-sys-secondary); font-size: 1.6rem; font-weight: 700; }
      .success-card .message-box { display: flex; align-items: flex-start; gap: 12px; padding: 18px; margin-top: 20px; border-radius: 14px; border: 0; background: var(--mat-sys-surface-container); }
      .success-card .message-icon { flex-shrink: 0; color: var(--mat-sys-primary); margin: 0; }
      .success-card .message-text p { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; line-height: 1.6; }
      .success-card .message-text strong { color: var(--mat-sys-primary); }
      .success-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; padding: 20px 24px; background: var(--mat-sys-surface-container); border-top: 1px solid var(--mat-sys-outline-variant); }
      .success-actions button { min-height: 44px; min-width: 150px; margin: 0; }
      @media (max-width: 600px) {
        .pago-exitoso-container { padding: 16px 12px; }
        .success-header { padding: 20px 16px; gap: 12px; }
        .success-title { font-size: 1.2rem; }
        .success-details { padding: 16px; }
        .success-card .info-row { grid-template-columns: 1fr; gap: 4px; padding: 12px 14px; }
        .success-card .value { text-align: left; }
        .success-actions { padding: 16px; flex-direction: column; }
        .success-actions button { width: 100%; }
      }
    `,
  ],
})
export class PagoExitosoComponent implements OnInit {
  boletaData: BoletaElectronicaResponse | null = null;

  isLoading = true;
  error: string | null = null;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentoService = inject(DocumentoService);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const idDocumento = params.get("idDocumento");

    if (!idDocumento || isNaN(Number(idDocumento))) {
      this.error =
        "No se recibieron los datos del documento. Por favor, contacte con soporte.";
      this.isLoading = false;
      return;
    }

    this.documentoService.obtenerBoleta(Number(idDocumento)).subscribe({
      next: (boleta) => {
        this.boletaData = boleta;
        this.isLoading = false;
        this.limpiarParametrosURL();
      },
      error: (e) => {
        console.error("Error al obtener la boleta:", e);
        this.error =
          "No se pudo generar la boleta. Por favor, contacte con soporte.";
        this.isLoading = false;
      },
    });
  }

  private limpiarParametrosURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete("purchaseNumber");
    url.searchParams.delete("transactionDate");
    url.searchParams.delete("fecha");
    url.searchParams.delete("Fecha");
    url.searchParams.delete("amount");
    url.searchParams.delete("Amount");
    url.searchParams.delete("tipoMoneda");
    url.searchParams.delete("TipoMoneda");
    url.searchParams.delete("currency");
    url.searchParams.delete("CURRENCY");
    url.searchParams.delete("boleta");
    url.searchParams.delete("idDocumento");
    window.history.replaceState({}, document.title, url.toString());
  }

  private convertirNumero(valor: string | number | null | undefined): number | null {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = typeof valor === "number" ? valor : Number(valor.replace(",", "."));
    return Number.isFinite(numero) ? numero : null;
  }

  formatearFechaPago(fecha: string): string {
    const fechaNiubiz = fecha.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (fechaNiubiz) {
      const [, anio, mes, dia, hora, minuto] = fechaNiubiz;
      return `${dia}/${mes}/20${anio} ${hora}:${minuto}`;
    }
    const date = new Date(fecha);
    return Number.isNaN(date.getTime()) ? fecha : date.toLocaleString("es-PE");
  }

  formatearImportePago(): string {
    if (this.boletaData.amount === null) return "N/A";
    return `${this.boletaData.currency || ""} ${this.boletaData.amount}`.trim();
  }

  volverAlInicio() {
    this.router.navigate(["/home"]);
  }

  esVentaLibro(): boolean {
    const concepto = this.boletaData?.concepto || "";
    return (
      concepto.toLowerCase().includes("venta") ||
      concepto.toLowerCase().startsWith("venta")
    );
  }

  getTipoDocumento(): string {
    const serie = this.boletaData?.serie || "";
    return serie.toUpperCase().startsWith("F") ? "FACTURA" : "BOLETA";
  }

  getTituloDocumento(): string {
    const tipo = this.getTipoDocumento();
    return tipo === "FACTURA"
      ? "¡Factura Generada Exitosamente!"
      : "¡Pago Realizado Exitosamente!";
  }

  imprimirTicket() {
    this.imprimirFormatoTicket();
  }

  imprimirFormatoNormal() {
    const printContent = document.getElementById("boleta-content");
    if (!printContent) return;

    const servicioContentNormal = this.esVentaLibro()
      ? `<div class="course-grid">
           <div class="course-item full-width">
             <strong>Tipo:</strong> Venta de Libro
           </div>
           ${this.boletaData?.nombreLibro ? `<div class="course-item full-width"><strong>Libro:</strong> ${this.boletaData.nombreLibro}</div>` : ""}
         </div>`
      : `<div class="course-grid">
           <div class="course-item"><strong>Periodo:</strong> ${this.boletaData?.periodo || "N/A"}</div>
           <div class="course-item"><strong>Curso:</strong> ${this.boletaData?.curso || "N/A"}</div>
           <div class="course-item"><strong>Turno:</strong> ${this.boletaData?.turno || "N/A"}</div>
           <div class="course-item"><strong>Aula:</strong> ${this.boletaData?.aula || "N/A"}</div>
           <div class="course-item"><strong>Profesor:</strong> ${this.boletaData?.profesor || "N/A"}</div>
         </div>`;

    const WindowPrt = window.open(
      "",
      "",
      "width=900,height=650,scrollbars=yes,resizable=yes",
    );
    if (!WindowPrt) return;

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
        <title>${this.getTipoDocumento()} Electrónica</title>
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
    const WindowPrt = window.open(
      "",
      "",
      "width=300,height=600,scrollbars=yes,resizable=yes",
    );
    if (!WindowPrt) return;

    const ticketContent = this.generarContenidoTicket();

    WindowPrt.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${this.getTipoDocumento()} Electrónica</title>
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
    const fechaFormateada = fecha.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const fechaInicio = new Date(this.boletaData?.fechaInicio || new Date());
    const fechaInicioFormateada = fechaInicio.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const fechaFinal = new Date(this.boletaData?.fechaFinal || new Date());
    const fechaFinalFormateada = fechaFinal.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const servicioContent = this.esVentaLibro()
      ? `<div class="small">Tipo: Venta de Libro</div>
         ${this.boletaData?.nombreLibro ? `<div class="small">Libro: ${this.boletaData.nombreLibro}</div>` : ""}`
      : `<div class="small">Periodo: ${this.boletaData?.periodo || "N/A"}</div>
         <div class="small">Curso: ${this.boletaData?.curso || "N/A"}</div>
         <div class="small">Aula: ${this.boletaData?.aula || "N/A"}</div>
         <div class="small">Turno: ${this.boletaData?.turno || "N/A"}</div>
         <div class="small">Prof: ${this.boletaData?.profesor || "N/A"}</div>
         <div class="small">Fecha Inicio: ${fechaInicioFormateada || "N/A"}</div>
         <div class="small">Fecha Fin: ${fechaFinalFormateada || "N/A"}</div>`;
    const descripcionServicio = this.esVentaLibro()
      ? `${this.boletaData?.concepto || "Venta"} - ${this.boletaData?.nombreLibro || "Libro"}`
      : `${this.boletaData?.concepto || "Matrícula"} - ${this.boletaData?.curso || "Curso"}`;


    return `
      <div class="ticket-container">
        <div class="center">
          <img src="https://elcultural.edu.pe/images/navbarLogo.png" alt="Logo" class="logo">
          <div class="bold">Centro Peruano Americano</div>
          <div class="bold">El Cultural</div>
          <div class="small">RUC: 20132111082</div>
          <div class="small">Av. Venezuela 128 - Trujillo</div>
          <div class="small">Tel: (044) 231512</div>
        </div>

        <div class="separator"></div>

        <div class="center bold">
          ${this.getTipoDocumento()} DE VENTA ELECTRONICA
        </div>
        <div class="center bold">
          ${this.boletaData?.serie || "B012"}-${this.boletaData?.numero || "00000001"}
        </div>

        <div class="separator"></div>

        <div><strong>CLIENTE:</strong></div>
        <div class="small">Cod: ${this.boletaData?.codigo || "N/A"}</div>
        <div class="small">DNI: ${this.boletaData?.docId || "N/A"}</div>
        <div class="small no-wrap">${this.boletaData?.completo || "Cliente"}</div>

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

  async descargarPDF() {
    const element = document.getElementById(
      "boleta-content",
    ) as HTMLElement | null;
    if (!element) return;

    const pdfWrapper = document.createElement("div");
    pdfWrapper.style.cssText = `
      position: fixed;
      left: -10000px;
      top: 0;
      width: 794px;
      padding: 24px;
      background: #ffffff;
      z-index: -1;
    `;

    const contentClone = element.cloneNode(true) as HTMLElement;
    contentClone.style.display = "block";
    pdfWrapper.appendChild(contentClone);
    document.body.appendChild(pdfWrapper);

    try {
      const canvas = await html2canvas(pdfWrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const serie = this.boletaData?.serie || "B";
      const numero = this.boletaData?.numero || "00000000";
      pdf.save(`boleta-${serie}-${numero}.pdf`);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      this.imprimirFormatoNormal();
    } finally {
      document.body.removeChild(pdfWrapper);
    }
  }

  volver() {
    this.router.navigate(["/home"]);
  }
}

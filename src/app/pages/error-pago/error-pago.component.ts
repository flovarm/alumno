import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { Router, ActivatedRoute } from "@angular/router";

export interface NiubizErrorResponse {
  errorCode?: number;
  errorMessage?: string;
  purchaseNumber?: string;
  PurchaseNumber?: string;
  transactionDate?: string;
  TransactionDate?: string;
  amount?: number | string;
  Amount?: number | string;
  tipoMoneda?: string;
  TipoMoneda?: string;
  denegacion?: string;
  Denegacion?: string;
  fecha?: string;
  Fecha?: string;
  header?: {
    ecoreTransactionUUID?: string;
    ecoreTransactionDate?: number;
  };
  data?: {
    YAPE_ID?: string;
    CURRENCY?: string;
    TERMINAL?: string;
    TRANSACTION_DATE?: string;
    ACTION_CODE?: string;
    TRACE_NUMBER?: string;
    CARD_TYPE?: string;
    CARD?: string;
    BRAND?: string;
    MERCHANT?: string;
    STATUS?: string;
    ACTION_DESCRIPTION?: string;
    ADQUIRENTE?: string;
    AMOUNT?: string;
    PROCESS_CODE?: string;
  };
}

@Component({
  selector: "app-error-pago",
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
      <div class="error-container">
        <mat-card class="error-card">
          <mat-card-content>
            <div class="loading-content">
              <mat-icon class="loading-icon">refresh</mat-icon>
              <p>Cargando información del error...</p>
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

    <!-- Vista de Error de Pago -->
    @if (errorData && !isLoading) {
      <div class="error-pago-container">
        <mat-card class="error-card-content">
          <div class="error-header">
            <div class="error-icon-big">
              <mat-icon class="error-icon">cancel</mat-icon>
            </div>
            <div class="error-content">
              <mat-card-title class="error-title">
                Tu pago no pudo ser procesado
              </mat-card-title>
              <mat-card-subtitle class="error-subtitle">
                Se presentó un problema durante el procesamiento de tu pago
              </mat-card-subtitle>
            </div>
          </div>

          <mat-card-content class="error-details">
            <div class="transaction-info">
              @if (obtenerDatoPago("purchaseNumber")) {
                <div class="info-row">
                  <span class="label">Número de pedido:</span>
                  <span class="value">{{ obtenerDatoPago("purchaseNumber") }}</span>
                </div>
              }
              @if (obtenerDatoPago("transactionDate")) {
                <div class="info-row">
                  <span class="label">Fecha y hora del pedido:</span>
                  <span class="value">{{ formatearFecha(obtenerDatoPago("transactionDate")) }}</span>
                </div>
              }
              @if (obtenerDescripcionDenegacion()) {
                <div class="info-row">
                  <span class="label">Descripción de la denegación:</span>
                  <span class="value">{{ obtenerDescripcionDenegacion() }}</span>
                </div>
              }
            </div>

            <div class="error-message">
              <div class="message-box">
                <mat-icon class="message-icon">info</mat-icon>
                <div class="message-text">
                  <p>
                    <strong>¿Qué puedo hacer?</strong>
                  </p>
                  <p>
                    Verifica que los datos de tu tarjeta sean correctos y que
                    tengas fondos disponibles, luego intenta nuevamente.
                  </p>
                  <p>
                    Si el problema continúa, puedes realizar el pago mediante
                    otro medio (Yape, transferencia o en nuestras
                    instalaciones).
                  </p>
                  <p>
                    <strong>Horario de atención:</strong> Lunes a viernes de 8am
                    a 7.15pm y sábado de 8am a 3.45pm.
                  </p>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="error-actions">
            <button
              mat-raised-button
              color="primary"
              (click)="reintentarPago()"
            >
              <mat-icon>refresh</mat-icon>
              Intentar Nuevamente
            </button>

            <button mat-stroked-button (click)="volverAlInicio()">
              <mat-icon>home</mat-icon>
              Ir al Inicio
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: [
    `
      .error-container,
      .error-pago-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 2rem;
      }

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
        --md-primary: var(--mat-sys-primary);
        --md-on-primary: var(--mat-sys-on-primary);
        --md-primary-container: var(--mat-sys-primary-container);
        --md-on-primary-container: var(--mat-sys-on-primary-container);
        --md-secondary: var(--mat-sys-secondary);
        --md-on-secondary: var(--mat-sys-on-secondary);
        --md-secondary-container: var(--mat-sys-secondary-container);
        --md-on-secondary-container: var(--mat-sys-on-secondary-container);
        --md-surface: var(--mat-sys-surface);
        --md-surface-dim: var(--mat-sys-surface-dim);
        --md-surface-bright: var(--mat-sys-surface-bright);
        --md-surface-container: var(--mat-sys-surface-container);
        --md-surface-container-low: var(--mat-sys-surface-container-low);
        --md-surface-container-high: var(--mat-sys-surface-container-high);
        --md-surface-container-highest: var(--mat-sys-surface-container-highest);
        --md-surface-variant: var(--mat-sys-surface-variant);
        --md-outline: var(--mat-sys-outline);
        --md-outline-variant: var(--mat-sys-outline-variant);
        --md-on-surface: var(--mat-sys-on-surface);
        --md-on-surface-variant: var(--mat-sys-on-surface-variant);
        --md-inverse-surface: var(--mat-sys-inverse-surface);
        --md-inverse-on-surface: var(--mat-sys-inverse-on-surface);
        --md-inverse-primary: var(--mat-sys-inverse-primary);
        --md-error: var(--mat-sys-error);
        --md-on-error: var(--mat-sys-on-error);
        --md-error-container: var(--mat-sys-error-container);
        --md-on-error-container: var(--mat-sys-on-error-container);
        --card-bg: var(--md-surface);
        --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        --header-bg: linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-error) 92%, black) 0%,
          var(--md-error) 100%
        );
        --info-bg: var(--md-surface-container);
        --info-border: var(--md-outline-variant);
        --text-primary: var(--md-on-surface);
        --text-secondary: var(--md-on-surface-variant);
        --message-bg: color-mix(
          in srgb,
          var(--md-error-container) 65%,
          var(--md-surface) 35%
        );
        --message-border: var(--md-outline-variant);
        --message-text: var(--md-on-error-container);
        --message-icon: var(--md-error);
      }

      .error-card-content {
        max-width: 600px;
        width: 100%;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        overflow: hidden;
        animation: slideIn 0.6s ease-out;
        background: var(--md-surface);
        border: 1px solid var(--md-outline-variant);
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

      .error-header {
        background: var(--header-bg);
        color: var(--md-on-error);
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border-bottom: 1px solid var(--md-outline-variant);
      }

      .error-icon-big {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-header .error-icon {
        font-size: 4rem;
        color: var(--md-on-error);
        animation: shake 0.8s ease-in-out 0.3s both;
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        20% {
          transform: translateX(-8px);
        }
        40% {
          transform: translateX(8px);
        }
        60% {
          transform: translateX(-6px);
        }
        80% {
          transform: translateX(6px);
        }
      }

      .error-content {
        flex: 1;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        color: var(--md-on-error);
      }

      .error-subtitle {
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
        color: var(--md-on-error);
      }

      .error-details {
        padding: 2rem;
        background: var(--card-bg);
        color: var(--text-primary);
      }

      .transaction-info {
        background: var(--info-bg);
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

      .label {
        color: var(--text-secondary);
        font-weight: 500;
      }

      .value {
        color: var(--text-primary);
        font-weight: 600;
        text-align: right;
      }

      .error-message {
        margin-bottom: 1rem;
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

      .error-actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem 2rem 2rem 2rem;
        flex-wrap: wrap;
        background: var(--card-bg);
      }

      .error-actions button {
        min-width: 180px;
      }

      @media (max-width: 768px) {
        .error-container,
        .error-pago-container {
          padding: 1rem;
          min-height: calc(100vh - 150px);
        }

        .error-header {
          flex-direction: column;
          text-align: center;
          padding: 1.5rem;
          gap: 1rem;
        }

        .error-title {
          font-size: 1.25rem;
        }

        .error-details {
          padding: 1.5rem;
        }

        .error-actions {
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .error-actions button {
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
      }

      /* Resultado del pago: estilos de pantalla, sin alterar el comprobante. */
      .error-pago-container { display: block; max-width: 840px; margin: 0 auto; padding: 32px 24px; min-height: 0; }
      .error-card-content { width: 100%; max-width: none; border-radius: 20px; border: 1px solid var(--mat-sys-outline-variant); box-shadow: none; animation: none; background: var(--mat-sys-surface-container-low); overflow: hidden; }
      .error-header { display: flex; align-items: center; gap: 16px; padding: 28px; background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); border-bottom: 1px solid var(--mat-sys-outline-variant); }
      .error-header .error-content { display: block; text-align: left; min-width: 0; }
      .error-header mat-icon { width: 48px; height: 48px; font-size: 48px; color: var(--mat-sys-error); animation: none; }
      .error-header > div:first-child { flex-shrink: 0; }
      .error-title { color: var(--mat-sys-on-error-container); font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 0; }
      .error-subtitle { color: var(--mat-sys-on-error-container); font-size: 0.95rem; line-height: 1.5; margin-top: 8px; opacity: 1; }
      .error-details { padding: 24px; }
      .error-card-content .transaction-info { padding: 0; margin: 0; border: 1px solid var(--mat-sys-outline-variant); border-radius: 14px; background: var(--mat-sys-surface); overflow: hidden; }
      .error-card-content .info-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 16px; padding: 14px 18px; margin: 0; border-bottom: 1px solid var(--mat-sys-outline-variant); }
      .error-card-content .info-row:last-child { border-bottom: 0; }
      .error-card-content .label { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; font-weight: 500; }
      .error-card-content .value { color: var(--mat-sys-on-surface); font-size: 0.95rem; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
      .error-card-content .total-row { background: var(--mat-sys-primary-container); border-top: 0; }
      .error-card-content .total-row .label { color: var(--mat-sys-on-primary-container); align-self: center; }
      .error-card-content .total-amount { color: var(--mat-sys-secondary); font-size: 1.6rem; font-weight: 700; }
      .error-card-content .message-box { display: flex; align-items: flex-start; gap: 12px; padding: 18px; margin-top: 20px; border-radius: 14px; border: 0; background: var(--mat-sys-surface-container); }
      .error-card-content .message-icon { flex-shrink: 0; color: var(--mat-sys-primary); margin: 0; }
      .error-card-content .message-text p { color: var(--mat-sys-on-surface-variant); font-size: 0.875rem; line-height: 1.6; }
      .error-card-content .message-text strong { color: var(--mat-sys-primary); }
      .error-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; padding: 20px 24px; background: var(--mat-sys-surface-container); border-top: 1px solid var(--mat-sys-outline-variant); }
      .error-actions button { min-height: 44px; min-width: 150px; margin: 0; }
      @media (max-width: 600px) {
        .error-pago-container { padding: 16px 12px; }
        .error-header { padding: 20px 16px; gap: 12px; }
        .error-title { font-size: 1.2rem; }
        .error-details { padding: 16px; }
        .error-card-content .info-row { grid-template-columns: 1fr; gap: 4px; padding: 12px 14px; }
        .error-card-content .value { text-align: left; }
        .error-actions { padding: 16px; flex-direction: column; }
        .error-actions button { width: 100%; }
      }
    `,
  ],
})
export class ErrorPagoComponent implements OnInit {
  private readonly purchaseNumberStorageKey = "niubiz_purchase_number";

  errorData: NiubizErrorResponse | null = null;
  isLoading = true;
  error: string | null = null;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const errorCodificada = params.get("error");

    if (!errorCodificada) {
      this.error =
        "No se recibieron los datos del error. Por favor, contacte con soporte.";
      this.isLoading = false;
      return;
    }

    try {
      this.errorData = this.decodificarError(errorCodificada);
      this.completarPurchaseNumber();
    } catch (e) {
      console.error("Error al decodificar el error:", e);
      this.error =
        "No se pudo mostrar la información del error. Por favor, contacte con soporte.";
    } finally {
      this.isLoading = false;
    }

    this.limpiarParametrosURL();
  }

  private decodificarError(codificada: string): NiubizErrorResponse {
    const base64 = codificada.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const bin = atob(base64.padEnd(base64.length + padding, "="));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(json) as NiubizErrorResponse;
  }

  private limpiarParametrosURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.toString());
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return "N/A";
    const match = fecha.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (!match) return fecha;
    const [, anio, mes, dia, hora, minuto] = match;
    return `${dia}/${mes}/20${anio} ${hora}:${minuto}`;
  }

  obtenerDatoPago(
    campo: "purchaseNumber" | "transactionDate",
  ): string | undefined {
    const datos = this.errorData as Record<string, unknown> | null;
    const datosNiubiz = datos?.["data"] as Record<string, unknown> | undefined;
    const equivalentes: Record<typeof campo, string[]> = {
      purchaseNumber: ["PURCHASE_NUMBER", "PURCHASENUMBER"],
      transactionDate: ["TRANSACTION_DATE", "TRANSACTIONDATE", "FECHA"],
    };
    const valor =
      datos?.[campo] ??
      datos?.[campo[0].toUpperCase() + campo.slice(1)] ??
      equivalentes[campo].map((clave) => datos?.[clave]).find((dato) => dato != null) ??
      equivalentes[campo].map((clave) => datosNiubiz?.[clave]).find((dato) => dato != null);
    return valor === null || valor === undefined || valor === "" ? undefined : String(valor);
  }

  obtenerDescripcionDenegacion(): string | undefined {
    const datos = this.errorData as Record<string, unknown> | null;
    const datosNiubiz = datos?.["data"] as Record<string, unknown> | undefined;
    const claves = [
      "actionDescription",
      "ActionDescription",
      "ACTIONDESCRIPTION",
      "ACTION_DESCRIPTION",
      "denegacion",
      "Denegacion",
    ];
    const valor =
      claves.map((clave) => datos?.[clave]).find((dato) => dato != null) ??
      claves.map((clave) => datosNiubiz?.[clave]).find((dato) => dato != null);
    return valor === null || valor === undefined || valor === "" ? undefined : String(valor);
  }

  private completarPurchaseNumber(): void {
    if (this.obtenerDatoPago("purchaseNumber") || !this.errorData) return;

    const purchaseNumber = sessionStorage.getItem(this.purchaseNumberStorageKey);
    if (purchaseNumber) {
      this.errorData.purchaseNumber = purchaseNumber;
    }
  }

  reintentarPago() {
    this.router.navigate(["/registro-matricula"]);
  }

  volverAlInicio() {
    this.router.navigate(["/home"]);
  }
}

import { UltimoCursoComponent } from "../../components/ultimo-curso/ultimo-curso.component";
import { UltimoRegistro } from "../../models/ultimo-registro";
import { ChangeDetectorRef, Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { PeriodoService } from "../../services/periodo.service";
import { RegistroService } from "../../services/registro.service";
import { LibroService } from "../../services/libro.service";
import { PaymentSpinnerService } from "../../services/loading.service";
import { NiubizService } from "../../services/niubiz.service";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment.development";

@Component({
  selector: "app-compra-libros",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    UltimoCursoComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Compra de Libros"
        description="Adquiere libros y material académico"
        icon="book"
      >
      </app-page-header>

      <!-- Último Registro -->
      @if (ultimoRegistro()) {
        <app-ultimo-curso [registro]="ultimoRegistro()" />
      }

      <div class="compra-layout">
      <!-- Lista de Libros -->
      @if (libros() && libros().length > 0) {
        <mat-card class="libros-section">
          <mat-card-header>
            <mat-icon mat-card-avatar>library_books</mat-icon>
            <mat-card-title>Libros Disponibles</mat-card-title>
            <mat-card-subtitle
              >Material académico para tu curso</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content>
            <!-- Información de productos -->
            <div class="selection-info">
              <mat-icon>info</mat-icon>
              <span
                >Recuerde presentar el DNI del estudiante o el comprobante de
                pago para recoger el libro</span
              >
            </div>

            <div class="libros-grid">
              @for (libro of libros(); track libro.idProducto) {
                <mat-card
                  class="libro-card"
                  [class.selected]="isLibroSeleccionado(libro.idProducto)"
                >
                  <div class="libro-cover">
                    @if (isLibroSeleccionado(libro.idProducto)) {
                      <span class="included-badge"><mat-icon aria-hidden="true">check_circle</mat-icon> Incluido</span>
                    }
                    <img
                      [src]="obtenerPortada(libro)"
                      [alt]="libro.nombreProducto"
                      loading="lazy"
                      (error)="onImgError($event)"
                    />
                  </div>
                  <mat-card-content>
                    <div class="libro-info">
                      <h3 class="libro-nombre">{{ libro.nombreProducto }}</h3>
                      @if (libro.descripcion) {
                        <div class="descripcion">
                          <p>{{ libro.descripcion }}</p>
                        </div>
                      }
                      <div class="precio">
                        <span class="precio-valor"
                          >S/ {{ formatearPrecio(libro.precioVenta) }}</span
                        >
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Resumen de Compra -->
      @if (getLibrosSeleccionados().length > 0) {
        <mat-card class="resumen-compra-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>shopping_cart</mat-icon>
            <mat-card-title>Resumen de Compra</mat-card-title>
            <mat-card-subtitle>Libros incluidos</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="resumen-content">
              <div class="libro-seleccionado">
                @for (
                  libro of getLibrosSeleccionados();
                  track libro.idProducto
                ) {
                  <div class="libro-seleccionado-item">
                    <img
                      class="libro-miniatura"
                      [src]="obtenerPortada(libro)"
                      [alt]="libro.nombreProducto"
                      (error)="onImgError($event)"
                    />
                    <span>{{ libro.nombreProducto }}</span>
                    <span class="precio-item"
                      >S/ {{ formatearPrecio(libro.precioVenta) }}</span
                    >
                  </div>
                }
              </div>
              <div class="total-section">
                <div class="total-precio">
                  <mat-icon>calculate</mat-icon>
                  <span class="total-label">Total:</span>
                  <span class="total-valor"
                    >S/ {{ formatearPrecio(getPrecioTotal()) }}</span
                  >
                </div>
              </div>
            </div>
            <div class="mt-2">
              <mat-checkbox
                [checked]="terminosAceptados"
                (change)="terminosAceptados = $event.checked"
                [disabled]="procesandoPago"
              >
                He leído y acepto los
                <a
                  href="https://www.elcultural.com.pe/terminos-y-condiciones-del-servicio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="$event.stopPropagation()"
                >Términos y Condiciones</a>
              </mat-checkbox>
            </div>
            <div class="importante mt-2">
              <mat-icon>info</mat-icon>
              <span
                >No cierre la página hasta que se genere su comprobante de
                pago!</span
              >
            </div>
          </mat-card-content>
          <mat-card-actions class="centered-actions">
            <button
              mat-flat-button
              color="primary"
              (click)="procederCompra()"
              [disabled]="
                procesandoPago || !terminosAceptados || getLibrosSeleccionados().length === 0
              "
            >
              <mat-icon>payment</mat-icon>
              {{
                procesandoPago
                  ? "Procesando pago..."
                  : "PAGAR S/ " + formatearPrecio(getPrecioTotal())
              }}
            </button>
          </mat-card-actions>
        </mat-card>
      }

      </div>

      <!-- Mensaje de pago -->
      @if (paymentMessage) {
        <div class="payment-message" [ngClass]="paymentMessageClass" role="status" aria-live="polite">
          {{ paymentMessage }}

          @if (
            paymentMessageClass === "payment-error" &&
            paymentMessage.includes("pasarela")
          ) {
            <div class="retry-section">
              <button
                mat-raised-button
                color="accent"
                (click)="procesarPago()"
                [disabled]="procesandoPago || !terminosAceptados"
              >
                <mat-icon>refresh</mat-icon>
                Reintentar Pago
              </button>
            </div>
          }
        </div>
      }

      <!-- Mensaje cuando no hay libros -->
      @if (!libros() || libros().length === 0) {
        <mat-card class="no-libros-card">
          <mat-card-content>
            <div class="no-libros-content">
              <mat-icon>library_books</mat-icon>
              <h3>No hay libros disponibles</h3>
              <p>
                No se encontraron libros para tu curso en esta sede.
              </p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
        color: var(--mat-sys-on-surface);
      }
      app-page-header { display: block; margin-bottom: 24px; }
      mat-card { box-shadow: none; }
      .ultimo-registro-card, .libros-section, .resumen-compra-card, .no-libros-card {
        min-width: 0;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 18px;
        background: var(--mat-sys-surface-container-low);
        overflow: hidden;
      }
      mat-card-header { padding: 20px 20px 16px; }
      mat-card-title { font-size: 1.05rem; font-weight: 700; color: var(--mat-sys-primary); }
      mat-card-subtitle { margin-top: 4px; color: var(--mat-sys-on-surface-variant); font-size: 0.85rem; }
      mat-icon[mat-card-avatar] {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        margin-bottom: 0;
        border-radius: 12px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
      }
      mat-card-content { padding: 0 20px 20px; }
      .ultimo-registro-card { margin-bottom: 24px; }
      .ultimo-registro-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
      }
      .registro-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 12px;
        background: var(--mat-sys-surface-container);
        min-width: 0;
      }
      .registro-item mat-icon { flex-shrink: 0; color: var(--mat-sys-primary); }
      .registro-item > div { min-width: 0; overflow-wrap: anywhere; }
      .registro-label { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); margin-bottom: 3px; }
      .registro-value { font-size: 0.875rem; font-weight: 600; line-height: 1.4; }
      .compra-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
        align-items: stretch;
        gap: 24px;
      }
      .libros-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: 16px;
      }
      .libro-card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 14px;
        background: var(--mat-sys-surface);
      }
      .libro-card.selected { border-color: var(--mat-sys-primary); }
      .libro-cover {
        position: relative;
        display: grid;
        place-items: center;
        height: 260px;
        padding: 44px 24px 20px;
        background: var(--mat-sys-surface-container);
      }
      .libro-cover img { width: 100%; height: 100%; min-height: 0; object-fit: contain; }
      .included-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        border-radius: 20px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        font-size: 0.75rem;
        font-weight: 600;
      }
      .included-badge mat-icon { width: 16px; height: 16px; font-size: 16px; }
      .libro-card mat-card-content { display: flex; flex: 1; padding: 18px; }
      .libro-info { display: flex; flex-direction: column; width: 100%; min-width: 0; }
      .libro-nombre { margin: 0 0 8px; font-size: 1rem; font-weight: 700; color: var(--mat-sys-primary); line-height: 1.4; overflow-wrap: anywhere; }
      .descripcion p { margin: 0 0 12px; font-size: 0.875rem; line-height: 1.5; color: var(--mat-sys-on-surface-variant); }
      .precio { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--mat-sys-outline-variant); }
      .precio-valor { color: var(--mat-sys-secondary); font-size: 1.25rem; font-weight: 700; }
      .selection-info, .importante {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        line-height: 1.5;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
      .selection-info { margin-bottom: 20px; }
      .selection-info mat-icon, .importante mat-icon { flex-shrink: 0; }
      .resumen-compra-card { border-color: var(--mat-sys-primary); }
      .libro-seleccionado-item {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 12px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        font-size: 0.85rem;
      }
      .libro-seleccionado-item span:first-of-type { overflow-wrap: anywhere; line-height: 1.4; }
      .libro-miniatura { width: 40px; height: 56px; object-fit: contain; border-radius: 4px; }
      .precio-item { color: var(--mat-sys-secondary); font-weight: 600; white-space: nowrap; }
      .total-section { margin: 20px 0 16px; }
      .total-precio { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
      .total-precio mat-icon { color: var(--mat-sys-primary); }
      .total-label { flex: 1; color: var(--mat-sys-primary); font-weight: 600; }
      .total-valor { font-size: 1.75rem; font-weight: 750; color: var(--mat-sys-secondary); }
      .precio-item, .precio-valor, .total-valor { font-variant-numeric: tabular-nums; }
      .centered-actions { margin-top: auto; padding: 0 20px 20px; }
      .centered-actions button { width: 100%; min-height: 48px; font-weight: 700; }
      .payment-message { margin-top: 20px; padding: 16px; border-radius: 12px; line-height: 1.5; }
      .payment-success { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
      .payment-error { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
      .retry-section { margin-top: 12px; }
      .no-libros-card { margin-top: 20px; }
      .no-libros-content { padding: 40px 16px 20px; text-align: center; }
      .no-libros-content mat-icon { width: 48px; height: 48px; font-size: 48px; color: var(--mat-sys-primary); }
      .no-libros-content h3 { color: var(--mat-sys-primary); font-size: 1.15rem; margin: 16px 0 8px; }
      .no-libros-content p { color: var(--mat-sys-on-surface-variant); margin: 0; }
      @media (max-width: 960px) {
        .ultimo-registro-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .compra-layout { grid-template-columns: 1fr; }
      }
      @media (max-width: 600px) {
        .page-container { padding: 16px 12px; }
        .ultimo-registro-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .registro-item:last-child { grid-column: 1 / -1; }
        mat-card-header { padding: 16px; }
        mat-card-content { padding: 0 16px 16px; }
        .libros-grid { grid-template-columns: 1fr; }
        .centered-actions { padding: 0 16px 16px; }
        .libro-cover { height: 240px; }
      }
    `,
  ],
})
export class CompraLibrosComponent implements OnInit {
  ultimoRegistro = signal<UltimoRegistro | null>(null);
  periodoActual = signal<any>(null);
  libros = signal<any[]>([]);
  librosSeleccionados = signal<Set<number>>(new Set());
  tipoLibros = signal<any[]>([]);

  tipoLibroControl = new FormControl<number | null>(null);
  private changeDetector = inject(ChangeDetectorRef);
  private pagoEnviado = false;
  procesandoPago = false;
  terminosAceptados = false;
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private sessionKeyActual: string | null = null;
  private montoActual = "0";
  private orderNumberActual: string | null = null;
  private idCursoActual: number | null = null;
  private idSedeActual: string | null = null;

  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private libroService = inject(LibroService);
  private niubizService = inject(NiubizService);
  private router = inject(Router);
  private paymentSpinner = inject(PaymentSpinnerService);

  user = JSON.parse(localStorage.getItem("alumno_currentUser"));

  ngOnInit(): void {
    this.cargarCheckoutNiubiz();
    this.verificarRetornoPagoNiubiz();

    this.periodoService.ultimos12Periodos().subscribe((periodos: any) => {
      if (Array.isArray(periodos) && periodos.length > 0) {
        this.periodoActual.set(periodos[0]);
      }
    });

    this.registroService
      .obtenerUltimoRegistroPorAlumno(this.user.userName)
      .subscribe((registro) => {
        this.ultimoRegistro.set(registro);
        if (registro) this.cargarLibros(registro);
      });
  }

  cargarLibros(registro: UltimoRegistro): void {
    this.idCursoActual = registro.idCurso;
    this.idSedeActual = registro.idSede;

    this.libroService
      .obtenerLibroUltimoCurso(registro.idCurso, registro.idSede)
      .subscribe((libros: any[]) => {
        this.libros.set(libros);
        // Por defecto, seleccionar todos los libros
        const todosSeleccionados = new Set(
          libros.map((libro) => libro.idProducto),
        );
        this.librosSeleccionados.set(todosSeleccionados);
      });
  }

  getPrecioTotal(): number {
    const seleccionados = this.librosSeleccionados();
    return this.libros()
      .filter((libro) => seleccionados.has(libro.idProducto))
      .reduce((total, libro) => total + (libro.precioVenta || 0), 0);
  }

  getLibrosSeleccionados(): any[] {
    const seleccionados = this.librosSeleccionados();
    return this.libros().filter((libro) => seleccionados.has(libro.idProducto));
  }

  isLibroSeleccionado(idProducto: number): boolean {
    return this.librosSeleccionados().has(idProducto);
  }

  obtenerPortada(libro: any): string {
    return libro?.imgUrl || "/images/PortadaNoDisponible.png";
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = "/images/PortadaNoDisponible.png";
  }

  formatearPrecio(valor: number): string {
    return valor.toFixed(2);
  }

  getTipoSeleccionado(): string {
    const tipoId = this.tipoLibroControl.value;
    if (!tipoId) return "";

    const tipo = this.tipoLibros().find((t) => t.idTlweb === tipoId);
    return tipo ? tipo.detalle : "";
  }

  procederCompra(): void {
    if (this.getLibrosSeleccionados().length > 0) {
      this.procesarPago();
    }
  }

  procesarPago(): void {
    if (!this.terminosAceptados) return;
    if (this.getLibrosSeleccionados().length === 0) return;
    if (this.procesandoPago) return;

    this.procesandoPago = true;
    this.paymentMessage = "";

    const total = this.getPrecioTotal();
    const merchantId = environment.niubiz.merchantId;
    const periodoId =
      this.periodoActual()?.idPeriodo || Date.now().toString().slice(-8);
    const purchaseNumber = this.obtenerPurchaseNumber(periodoId);
    if (!purchaseNumber) {
      this.showPaymentMessage(
        "No se pudo generar el número de compra. Intente nuevamente.",
        "error",
      );
      this.procesandoPago = false;
      return;
    }

    this.niubizService.prepararYCrearSession(
      {
        purchaseNumber,
        amount: total,
        merchantId,
        tipoOperacion: "libro",
        docid: this.user?.userName,
        idCurso: this.idCursoActual ?? undefined,
        idSede: this.idSedeActual ?? undefined,
      },
      this.user.codigo,
    )
      .subscribe({
        next: (sessionResponse) => {
          this.procesandoPago = false;
          this.sessionKeyActual = sessionResponse.sessionKey;
          this.montoActual = total.toFixed(2);
          this.orderNumberActual = purchaseNumber;
          this.abrirPagoNiubiz();
        },
        error: (err) => {
          console.error("Error al crear sesión Niubiz", err);
          this.showPaymentMessage("Error al obtener sesión de pago", "error");
          this.procesandoPago = false;
        },
      });
  }

  private abrirPagoNiubiz(): void {
    if (!this.terminosAceptados || this.pagoEnviado) return;
    const w = window as any;
    if (!w.VisanetCheckout || !this.sessionKeyActual) {
      this.showPaymentMessage(
        "El formulario de pago aún no está disponible. Intente nuevamente.",
        "error",
      );
      return;
    }

    const merchantId = environment.niubiz.merchantId;
    const purchaseNumber = this.orderNumberActual;
    if (!purchaseNumber) {
      this.showPaymentMessage(
        "No se pudo obtener el número de compra. Intente nuevamente.",
        "error",
      );
      return;
    }
    const actionUrl = `${environment.apiUrl}Pago/ProcesarPagoLibroNiubiz/${merchantId}/${this.user.userName}/${this.idCursoActual}/${this.idSedeActual}/${purchaseNumber}`;
    sessionStorage.setItem("niubiz_purchase_number", purchaseNumber);

    w.VisanetCheckout.configure({
      sessiontoken: this.sessionKeyActual,
      channel: "web",
      merchantid: merchantId,
      purchasenumber: purchaseNumber,
      amount: parseFloat(this.montoActual),
      expirationminutes: "20",
      timeouturl: `${window.location.origin}/compra-libros`,
      merchantlogo: "https://elcultural.edu.pe/images/navbarLogo.png",
      formbuttoncolor: "#1C04A4",
      action: actionUrl,
      complete: (params: any) => {
        if (this.pagoEnviado) return;
        this.pagoEnviado = true;
        this.procesandoPago = true;
        // El callback del SDK puede ejecutarse fuera de Angular.
        this.changeDetector.detectChanges();
        const formData = new FormData();
        formData.append("channel", "web");
        formData.append("order.tokenId", params.transactionToken || "");
        formData.append("order.purchaseNumber", purchaseNumber);
        formData.append("order.amount", this.montoActual);
        formData.append("order.currency", "PEN");

        // El backend procesa el pago, genera la boleta y redirige a
        // /pago-exitoso?idDocumento=... con los datos del documento.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = actionUrl;
        form.style.display = "none";
        formData.forEach((value, key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      },
    });

    w.VisanetCheckout.open();
  }

  private obtenerPurchaseNumber(periodoId: number | string): string | null {
    const usuario = String(this.user?.userName ?? "").trim();
    const periodo = String(periodoId ?? "").trim();
    if (!usuario || !periodo) return null;

    const purchaseNumber = `${periodo}${usuario}`.trim();
    return purchaseNumber || null;
  }

  private cargarCheckoutNiubiz(): void {
    const w = window as any;
    if (w.VisanetCheckout) return;
    if (document.getElementById("niubizCheckoutScript")) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "niubizCheckoutScript";
    script.src = environment.niubiz.scriptUrl;
    document.head.appendChild(script);
  }

  private verificarRetornoPagoNiubiz(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get("payment");
    if (!payment) return;
    this.limpiarParametrosURL();
  }

  private limpiarParametrosURL(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("transactionId");
    url.searchParams.delete("statusCode");
    url.searchParams.delete("message");
    window.history.replaceState({}, document.title, url.toString());
  }

  private showPaymentMessage(message: string, type: "success" | "error"): void {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";
  }
}

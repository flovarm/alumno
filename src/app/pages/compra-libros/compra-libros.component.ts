import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { PeriodoService } from "../../services/periodo.service";
import { RegistroService } from "../../services/registro.service";
import { LibroService } from "../../services/libro.service";
import { PaymentSpinnerService } from "../../services/loading.service";
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
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    PageHeaderComponent,
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
        <mat-card class="ultimo-registro-card" style="margin-bottom: 2rem;">
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Último Registro Académico</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="ultimo-registro-grid">
              <div class="registro-item">
                <mat-icon>calendar_today</mat-icon>
                <div>
                  <div class="registro-label">Período</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.periodo }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>book</mat-icon>
                <div>
                  <div class="registro-label">Curso</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.curso | titlecase }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>grade</mat-icon>
                <div>
                  <div class="registro-label">Nota</div>
                  <div
                    class="registro-value"
                    [style.color]="
                      ultimoRegistro()?.apruebaReg === 'P'
                        ? 'var(--mat-sys-primary)'
                        : 'var(--mat-sys-secondary)'
                    "
                  >
                    {{ ultimoRegistro()?.notaRegistro }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>location_on</mat-icon>
                <div>
                  <div class="registro-label">Sede</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.nombreSed }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <div class="registro-label">Turno</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.turno }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Lista de Libros -->
      @if (libros() && libros().length > 0) {
        <mat-card class="libros-section" style="margin-bottom: 2rem;">
          <mat-card-header>
            <mat-icon mat-card-avatar>library_books</mat-icon>
            <mat-card-title>Libros Disponibles</mat-card-title>
            <mat-card-subtitle
              >Material académico para tu curso -
              {{ getTipoSeleccionado() }}</mat-card-subtitle
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
                  <div class="checkbox-overlay">
                    <mat-checkbox
                      [checked]="isLibroSeleccionado(libro.idProducto)"
                      (change)="toggleLibroSeleccion(libro.idProducto)"
                      color="primary"
                      disabled="true"
                    >
                    </mat-checkbox>
                  </div>
                  <mat-card-header>
                    <mat-icon mat-card-avatar>menu_book</mat-icon>
                    <mat-card-title>{{ libro.nombreProducto }}</mat-card-title>
                    <mat-card-subtitle
                      >Código: {{ libro.codigoProducto }}</mat-card-subtitle
                    >
                  </mat-card-header>
                  <mat-card-content>
                    <div class="libro-info">
                      @if (libro.descripcion) {
                        <div class="descripcion">
                          <mat-icon>description</mat-icon>
                          <p>{{ libro.descripcion }}</p>
                        </div>
                      }
                      <div class="precio">
                        <span class="precio-valor"
                          >S/ {{ libro.precioVenta }}</span
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
        <mat-card class="resumen-compra-card" style="margin-bottom: 2rem;">
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
                    <mat-icon>book</mat-icon>
                    <span>{{ libro.nombreProducto }}</span>
                    <span class="precio-item">S/ {{ libro.precioVenta }}</span>
                  </div>
                }
              </div>
              <div class="total-section">
                <div class="total-precio">
                  <mat-icon>calculate</mat-icon>
                  <span class="total-label">Total:</span>
                  <span class="total-valor">S/ {{ getPrecioTotal() }}</span>
                </div>
              </div>
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
                procesandoPago ||
                formularioIziPayAbierto ||
                getLibrosSeleccionados().length === 0
              "
            >
              <mat-icon>payment</mat-icon>
              {{
                procesandoPago
                  ? "Procesando..."
                  : "PAGAR S/ " + getPrecioTotal()
              }}
            </button>
          </mat-card-actions>
        </mat-card>
      }

      <!-- Información de productos -->

      <!-- Mensaje de pago -->
      @if (paymentMessage) {
        <div class="payment-message" [ngClass]="paymentMessageClass">
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
                [disabled]="procesandoPago || formularioIziPayAbierto"
              >
                <mat-icon>refresh</mat-icon>
                Reintentar Pago
              </button>
            </div>
          }
        </div>
      }

      <!-- Container para el formulario de IziPay -->
      <div id="iframeContainer"></div>

      <!-- Mensaje cuando no hay libros -->
      @if (!libros() || libros().length === 0) {
        <mat-card class="no-libros-card">
          <mat-card-content>
            <div class="no-libros-content">
              <mat-icon>library_books</mat-icon>
              <h3>No hay libros disponibles</h3>
              <p>
                No se encontraron libros del tipo seleccionado para tu curso en
                esta sede.
              </p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .ultimo-registro-card {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 16px;
      }

      .ultimo-registro-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
      }

      .registro-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--mat-sys-surface-container-high);
        border-radius: 12px;
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .registro-item mat-icon {
        color: var(--mat-sys-primary);
        font-size: 1.5rem;
      }

      .registro-label {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 0.25rem;
      }

      .registro-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .tipo-libro-section {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 16px;
      }

      .libros-section {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 16px;
      }

      .libros-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
      }

      .libro-card {
        background: var(--mat-sys-surface);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        transition:
          box-shadow 0.2s,
          transform 0.2s,
          border-color 0.2s;
        position: relative;
      }

      .libro-card:hover {
        box-shadow: 0 4px 16px var(--mat-sys-shadow);
        transform: translateY(-2px);
      }

      .libro-card.selected {
        border: 2px solid var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }

      .checkbox-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
        background: var(--mat-sys-surface);
        border-radius: 4px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .selection-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--mat-sys-tertiary-container);
        border-radius: 8px;
        color: var(--mat-sys-on-tertiary-container);
      }

      .selection-info mat-icon {
        color: var(--mat-sys-tertiary);
      }

      .resumen-compra-card {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-primary);
        border-radius: 16px;
      }

      .resumen-content {
        margin-top: 1rem;
      }

      .libro-seleccionado {
        margin-bottom: 1.5rem;
      }

      .libro-seleccionado-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: var(--mat-sys-surface-container-high);
        border-radius: 8px;
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .libro-seleccionado-item mat-icon {
        color: var(--mat-sys-primary);
        font-size: 1.2rem;
      }

      .libro-seleccionado-item span:first-of-type {
        flex: 1;
        font-weight: 500;
      }

      .precio-item {
        font-weight: 600;
        color: var(--mat-sys-primary);
      }

      .total-section {
        border-top: 2px solid var(--mat-sys-outline);
        padding-top: 1rem;
      }

      .total-precio {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--mat-sys-primary-container);
        border-radius: 12px;
        border: 1px solid var(--mat-sys-primary);
      }

      .total-precio mat-icon {
        color: var(--mat-sys-primary);
        font-size: 1.5rem;
      }

      .total-label {
        flex: 1;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--mat-sys-on-primary-container);
      }

      .total-valor {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--mat-sys-primary);
      }

      .payment-message {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
      }

      .payment-success {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border: 1px solid var(--mat-sys-primary);
      }

      .payment-error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
        border: 1px solid var(--mat-sys-error);
      }

      .retry-section {
        margin-top: 1rem;
        text-align: center;
      }

      .centered-actions {
        display: flex;
        justify-content: center;
        padding: 1.5rem;
      }

      .centered-actions button {
        font-size: 1.1rem;
        padding: 12px 32px;
        min-width: 200px;
      }

      .selection-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      @media (max-width: 700px) {
        .horario-card-grid {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
      }

      @media (max-width: 768px) {
        .full-width {
          width: 100% !important;
        }

        .ultimo-registro-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .libros-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .mdc-list-item--with-trailing-radio.mdc-list-item,
        .mdc-list-item--with-trailing-checkbox.mdc-list-item {
          padding-left: 8px;
          padding-right: 0;
          height: 300px;
        }

        .schedule-grid {
          grid-template-columns: 1fr;
        }

        .schedule-day {
          padding: 0.75rem;
        }
      }

      .full-width {
        width: 50%;
        font-size: 1rem;
      }

      .tipo-libro-section .mat-mdc-form-field {
        font-size: 1rem;
      }

      .tipo-libro-section .mat-mdc-select {
        font-size: 1rem;
      }

      .option-text {
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        font-size: 1rem;
      }

      .option-status {
        font-size: 0.9rem;
        color: var(--mat-sys-error);
        font-style: italic;
      }

      .tipo-libro-section .mat-mdc-select-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
      }
    `,
  ],
})
export class CompraLibrosComponent implements OnInit {
  ultimoRegistro = signal<any>(null);
  periodoActual = signal<any>(null);
  libros = signal<any[]>([]);
  librosSeleccionados = signal<Set<number>>(new Set());
  tipoLibros = signal<any[]>([]);

  tipoLibroControl = new FormControl<number | null>(null);
  procesandoPago = false;
  formularioIziPayAbierto = false;
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private izipayLoaded = false;

  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private libroService = inject(LibroService);
  private router = inject(Router);
  private paymentSpinner = inject(PaymentSpinnerService);

  user = JSON.parse(localStorage.getItem("alumno_currentUser"));

  ngOnInit(): void {
    this.periodoService.ultimos12Periodos().subscribe((periodos: any) => {
      if (Array.isArray(periodos) && periodos.length > 0) {
        this.periodoActual.set(periodos[0]);
      }
    });

    this.registroService
      .obtenerUltimoRegistroPorAlumno(this.user.userName)
      .subscribe((registro: any) => {
        this.ultimoRegistro.set(registro);
        this.cargarLibros(registro);
      });
  }

  cargarLibros(registro: any): void {
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

  toggleLibroSeleccion(idProducto: number): void {
    const seleccionados = new Set(this.librosSeleccionados());
    if (seleccionados.has(idProducto)) {
      seleccionados.delete(idProducto);
    } else {
      seleccionados.add(idProducto);
    }
    this.librosSeleccionados.set(seleccionados);
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
    if (this.getLibrosSeleccionados().length === 0) return;

    this.procesandoPago = true;
    this.paymentMessage = "";

    // Mostrar spinner de pago para libros
    this.paymentSpinner.showBookPurchaseSpinner(
      "Iniciando proceso de compra...",
    );

    // Pago real - usar el precio total de todos los libros
    const total = this.getPrecioTotal();
    const transactionId =
      Date.now().toString() + Math.random().toString().substr(2, 5);
    const orderNumber =
      this.ultimoRegistro().idRegistro + this.ultimoRegistro().docid;

    this.registroService
      .obtenerTokenPago(total, transactionId, orderNumber)
      .subscribe({
        next: (tokenResponse: any) => {
          if (tokenResponse.code === "00") {
            this.initializeIziPay(
              tokenResponse,
              total,
              transactionId,
              orderNumber,
            );
          } else {
            this.paymentSpinner.hideBookPurchaseSpinner();
            this.showPaymentMessage("Error al obtener token de pago", "error");
          }
          this.procesandoPago = false;
        },
        error: (err) => {
          this.paymentSpinner.hideBookPurchaseSpinner();
          this.showPaymentMessage("Error al procesar el pago", "error");
          this.procesandoPago = false;
        },
      });
  }

  private initializeIziPay(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber: string,
  ): void {
    if (!this.izipayLoaded) {
      this.loadIziPayScript().then(() => {
        this.setupIziPayForm(tokenResponse, amount, transactionId, orderNumber);
      });
    } else {
      this.setupIziPayForm(tokenResponse, amount, transactionId, orderNumber);
    }
  }

  private loadIziPayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Izipay) {
        this.izipayLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = environment.izipay.scriptUrl;
      script.onload = () => {
        this.izipayLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error("Error cargando IziPay script"));
      document.head.appendChild(script);
    });
  }

  private setupIziPayForm(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber: string,
  ): void {
    // Separar el nombreCompleto para obtener nombres y apellidos
    const nombreCompleto = this.user?.nombreCompleto || "";
    const partesNombre = nombreCompleto.split(" ");
    let firstName = "Usuario";
    let lastName = "Apellido";

    if (partesNombre.length >= 3) {
      // Formato: ApellidoPaterno ApellidoMaterno Nombres
      lastName = partesNombre[0]; // Apellido Paterno
      firstName = partesNombre.slice(2).join(" "); // Nombres
    } else if (partesNombre.length === 2) {
      firstName = partesNombre[1];
      lastName = partesNombre[0];
    }

    const dateTimeTransaction = (Date.now() * 1000).toString();

    const iziConfig = {
      config: {
        transactionId: transactionId,
        action: (window as any).Izipay.enums.payActions.PAY,
        merchantCode: environment.izipay.merchantCode,
        order: {
          orderNumber: orderNumber,
          currency: "PEN",
          amount: amount.toFixed(2),
          processType: (window as any).Izipay.enums.processType.AUTHORIZATION,
          merchantBuyerId: environment.izipay.merchantCode,
          dateTimeTransaction: dateTimeTransaction,
          payMethod: (window as any).Izipay.enums.showMethods.ALL,
        },
        billing: {
          firstName: firstName,
          lastName: lastName,
          email: this.user?.correo || "test@example.com",
          phoneNumber: this.user?.telefono || "999666333",
          street: "Av. Venezuela 128",
          city: "trujillo",
          state: "Trujillo",
          country: "PE",
          postalCode: "13001",
          document: this.user?.userName || "12345678",
          documentType:
            this.user?.userName && this.user.userName.length > 8
              ? (window as any).Izipay.enums.documentType.CE
              : (window as any).Izipay.enums.documentType.DNI,
        },
        render: {
          typeForm: (window as any).Izipay.enums.typeForm.POP_UP,
          container: "#iframeContainer",
          showButtonProcessForm: false,
        },
        appearance: {
          logo: "https://elcultural.edu.pe/images/asset6.png",
        },
      },
    };

    try {
      const checkout = new (window as any).Izipay(iziConfig);

      // Ocultar spinner de carga y mostrar spinner de pago
      this.paymentSpinner.hideBookPurchaseSpinner();
      this.paymentSpinner.showBookPurchaseSpinner(
        "Completa tu pago en la ventana emergente...",
      );

      this.formularioIziPayAbierto = true;

      checkout.LoadForm({
        authorization: tokenResponse.response.token,
        keyRSA: "RSA",
        callbackResponse: (response: any) => {
          // Mostrar spinner de procesamiento
          this.paymentSpinner.hideBookPurchaseSpinner();
          this.paymentSpinner.showBookPurchaseSpinner(
            "Procesando compra de libros...",
          );

          this.formularioIziPayAbierto = false;
          this.handlePaymentResponse(response);
        },
        callbackError: (error: any) => {
          this.paymentSpinner.hideBookPurchaseSpinner();
          this.formularioIziPayAbierto = false;
          this.showPaymentMessage(
            "Error en el procesamiento del pago. La pasarela de pagos no está disponible temporalmente.",
            "error",
          );
        },
      });

      // Timeout para cerrar el formulario si no hay respuesta en 5 minutos
      setTimeout(() => {
        if (this.formularioIziPayAbierto) {
          this.paymentSpinner.hideBookPurchaseSpinner();
          this.formularioIziPayAbierto = false;
          this.showPaymentMessage(
            "El tiempo de espera para el pago ha expirado. Por favor, intente nuevamente.",
            "error",
          );
        }
      }, 300000); // 5 minutos
    } catch (error) {
      this.paymentSpinner.hideBookPurchaseSpinner();
      this.formularioIziPayAbierto = false;
      this.showPaymentMessage(
        "Error al inicializar el formulario de pago",
        "error",
      );
    }
  }

  private handlePaymentResponse(response: any): void {
    // Validar si la respuesta es válida
    if (!response || typeof response !== "object") {
      this.paymentSpinner.hideBookPurchaseSpinner();
      this.showPaymentMessage(
        "Error: Respuesta inválida del sistema de pagos. Por favor, contacte soporte.",
        "error",
      );
      return;
    }

    if (response.code === "00") {
      this.showPaymentMessage(
        "¡Pago exitoso! Registrando tu compra...",
        "success",
      );

      // Registrar la compra de todos los libros
      this.registrarCompraLibros(response);
    } else if (
      response.code === "504" ||
      response.message?.includes("timeout")
    ) {
      this.paymentSpinner.hideBookPurchaseSpinner();
      this.showPaymentMessage(
        "La pasarela de pagos no está respondiendo. Por favor, intente nuevamente en unos minutos.",
        "error",
      );
    } else {
      this.paymentSpinner.hideBookPurchaseSpinner();
      const errorMessage =
        response.message ||
        response.error ||
        "Error desconocido en el procesamiento del pago";
      this.showPaymentMessage(`Error en el pago: ${errorMessage}`, "error");
    }
  }

  private registrarCompraLibros(paymentResponse: any): void {
    // Cambiar mensaje del spinner
    this.paymentSpinner.hideBookPurchaseSpinner();
    this.paymentSpinner.showBookPurchaseSpinner(
      "Registrando compra de libros...",
    );

    const registro = this.ultimoRegistro();
    const libros = this.getLibrosSeleccionados();

    // Crear un solo DTO con todos los productos
    const compraLibrosDto = {
      idRegistro: registro.idRegistro,
      idProductos: libros.map((libro) => libro.idProducto.toString()),
      codigo: parseInt(this.user?.userName) || 0,
      docid: this.user?.userName || "",
      nombreLibro: libros.map((libro) => libro.nombreProducto).join(", "), // Concatenar nombres de libros
      idtipod: "03",
      serie: "B012",
      fecha: new Date().toISOString(),
      pCompra: libros.reduce(
        (total, libro) => total + (libro.precioCompra || 0),
        0,
      ),
      pVenta: this.getPrecioTotal(),
      cantidad: libros.length,
      subTotal: this.getPrecioTotal(),
      operacion: "S",
      estado: "A",
      id_sede: registro.idSede?.toString() || "1",
      usuario: "SISTEMAS",
      fechaU_pro: null,
      usuarioU_pro: "",
      fechae: new Date().toISOString(),
      estadoe: "P",
    };

    // Enviar una sola petición con todos los libros
    this.libroService.registrarLibro(compraLibrosDto).subscribe({
      next: (boletaData: any) => {
        this.paymentSpinner.hideBookPurchaseSpinner();
        this.paymentSpinner.showBookPurchaseSpinner(
          "¡Compra exitosa! Generando boleta...",
        );

        setTimeout(() => {
          this.paymentSpinner.hideBookPurchaseSpinner();
          this.router.navigate(["/boleta-electronica"], {
            state: boletaData,
            replaceUrl: false,
          });
        }, 2000);
      },
      error: (error) => {
        this.paymentSpinner.hideBookPurchaseSpinner();
        this.showPaymentMessage(
          "Pago exitoso, pero hubo un error al registrar la compra. Contacte soporte.",
          "error",
        );

        setTimeout(() => {
          this.router.navigate(["/compra-libros"], {
            replaceUrl: true,
          });
        }, 5000);
      },
    });
  }

  private showPaymentMessage(message: string, type: "success" | "error"): void {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";

    if (type === "error") {
      this.formularioIziPayAbierto = false;
    }
  }
}

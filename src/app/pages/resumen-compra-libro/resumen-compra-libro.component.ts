import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { Router } from "@angular/router";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { RegistroService } from "../../services/registro.service";
import { LibroService } from "../../services/libro.service";
import { environment } from "../../../environments/environment.development";

@Component({
  selector: "app-resumen-compra-libro",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Resumen de Compra"
        description="Confirma tu compra de libro"
        icon="shopping_cart"
      >
      </app-page-header>

      @if (libroData()) {
        <mat-card class="resumen-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>receipt</mat-icon>
            <mat-card-title>Detalle de la Compra</mat-card-title>
            <mat-card-subtitle
              >Revisa los detalles antes de proceder con el
              pago</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <mat-icon matListItemIcon>menu_book</mat-icon>
                <div matListItemTitle>Libro</div>
                <div matListItemLine>{{ libroData()?.nombreProducto }}</div>
              </mat-list-item>
              <mat-divider></mat-divider>

              <mat-list-item>
                <mat-icon matListItemIcon>qr_code</mat-icon>
                <div matListItemTitle>Código</div>
                <div matListItemLine>{{ libroData()?.codigoProducto }}</div>
              </mat-list-item>
              <mat-divider></mat-divider>

              @if (libroData()?.descripcion) {
                <mat-list-item>
                  <mat-icon matListItemIcon>description</mat-icon>
                  <div matListItemTitle>Descripción</div>
                  <div matListItemLine>{{ libroData()?.descripcion }}</div>
                </mat-list-item>
                <mat-divider></mat-divider>
              }

              <mat-list-item>
                <mat-icon matListItemIcon>person</mat-icon>
                <div matListItemTitle>Estudiante</div>
                <div matListItemLine>{{ userData()?.nombreCompleto }}</div>
              </mat-list-item>
              <mat-divider></mat-divider>

              <mat-list-item>
                <mat-icon matListItemIcon>badge</mat-icon>
                <div matListItemTitle>Documento</div>
                <div matListItemLine>{{ userData()?.userName }}</div>
              </mat-list-item>
              <mat-divider></mat-divider>

              <mat-list-item>
                <mat-icon matListItemIcon>email</mat-icon>
                <div matListItemTitle>Correo</div>
                <div matListItemLine>{{ userData()?.correo }}</div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>

          <mat-card-actions class="actions-container">
            <button mat-button (click)="volver()" [disabled]="procesandoPago">
              <mat-icon>arrow_back</mat-icon>
              Volver
            </button>
            <button
              mat-flat-button
              (click)="procesarPago()"
              [disabled]="procesandoPago || formularioIziPayAbierto"
            >
              <mat-icon>payment</mat-icon>
              {{
                procesandoPago
                  ? "Procesando..."
                  : "PAGAR S/" + libroData()?.precioVenta
              }}
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Mensaje de pago -->
        <div
          id="payment-message"
          class="payment-message"
          [style.display]="paymentMessage ? 'block' : 'none'"
          [ngClass]="paymentMessageClass"
        >
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

        <!-- Container para el formulario de IziPay -->
        <div id="iframeContainer"></div>
      } @else {
        <mat-card class="error-card">
          <mat-card-content>
            <div class="error-content">
              <mat-icon>error</mat-icon>
              <h3>Error</h3>
              <p>
                No se encontraron datos del libro. Por favor, regresa y
                selecciona un libro nuevamente.
              </p>
              <button mat-raised-button color="primary" (click)="volver()">
                <mat-icon>arrow_back</mat-icon>
                Volver a Compra de Libros
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .resumen-card {
        background: var(--mat-sys-surface);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 16px;
        margin-bottom: 2rem;
      }

      .total-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 2px solid var(--mat-sys-outline);
      }

      .total-precio {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1.5rem;
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
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--mat-sys-on-primary-container);
      }

      .total-valor {
        font-size: 2rem;
        font-weight: 700;
        color: var(--mat-sys-primary);
      }

      .actions-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
      }

      .error-card {
        background: var(--mat-sys-error-container);
        border: 1px solid var(--mat-sys-error);
        border-radius: 16px;
      }

      .error-content {
        text-align: center;
        padding: 2rem;
      }

      .error-content mat-icon {
        font-size: 4rem;
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }

      .error-content h3 {
        color: var(--mat-sys-on-error-container);
        margin-bottom: 0.5rem;
      }

      .error-content p {
        color: var(--mat-sys-on-error-container);
        margin-bottom: 2rem;
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

      .gateway-status {
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
        border: 1px solid var(--mat-sys-tertiary);
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        text-align: center;
      }

      .gateway-status mat-icon {
        color: var(--mat-sys-tertiary);
        margin-right: 0.5rem;
      }

      @media (max-width: 768px) {
        .actions-container {
          flex-direction: column;
          gap: 1rem;
        }

        .actions-container button {
          width: 100%;
        }

        .total-precio {
          flex-direction: column;
          text-align: center;
          gap: 0.5rem;
        }

        .total-label {
          flex: none;
        }
      }
    `,
  ],
})
export class ResumenCompraLibroComponent implements OnInit {
  libroData = signal<any>(null);
  userData = signal<any>(null);
  procesandoPago = false;
  formularioIziPayAbierto = false;
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private izipayLoaded = false;
  user = JSON.parse(localStorage.getItem("alumno_currentUser") || "{}");
  private router = inject(Router);
  private registroService = inject(RegistroService);
  private libroService = inject(LibroService);

  ngOnInit(): void {
    // Obtener datos del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.libro) {
      this.libroData.set(state.libro);
    }

    // Obtener datos del usuario
    this.userData.set(this.user);

    // Si no hay datos del libro, redirigir
    if (!this.libroData()) {
      this.volver();
    }
  }

  volver(): void {
    this.router.navigate(["/compra-libros"]);
  }

  procesarPago(): void {
    const libro = this.libroData();
    if (!libro) return;

    this.procesandoPago = true;
    this.paymentMessage = "";

    // Pago real
    const transactionId =
      Date.now().toString() + Math.random().toString().substr(2, 5);
    const orderNumber = libro.idProducto + this.user.userName;
    this.registroService
      .obtenerTokenPago(libro.precioVenta, transactionId, orderNumber)
      .subscribe({
        next: (tokenResponse: any) => {
          if (tokenResponse.code === "00") {
            this.initializeIziPay(
              tokenResponse,
              libro.precioVenta,
              transactionId,
              orderNumber,
            );
          } else {
            this.showPaymentMessage("Error al obtener token de pago", "error");
          }
          this.procesandoPago = false;
        },
        error: (err) => {
          console.error("Error al obtener token de pago:", err);
          this.showPaymentMessage("Error al procesar el pago", "error");
          this.procesandoPago = false;
        },
      });
  }

  private simularPagoExitoso(): void {
    console.log("🔄 SIMULANDO PAGO EXITOSO - MODO DESARROLLO");

    this.showPaymentMessage(
      "🧪 Simulando pago exitoso (modo desarrollo)...",
      "success",
    );

    // Simular delay de procesamiento
    setTimeout(() => {
      const simulatedResponse = {
        code: "00",
        message: "Pago simulado exitoso",
        transactionId: "SIM_" + Date.now(),
        amount: this.libroData()?.precioVenta,
      };

      this.procesandoPago = false;
      this.handlePaymentResponse(simulatedResponse);
    }, 2000);
  }

  private initializeIziPay(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber,
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
    orderNumber,
  ): void {
    const user = this.userData();
    const libro = this.libroData();

    // Separar el nombreCompleto para obtener nombres y apellidos
    const nombreCompleto = user?.nombreCompleto || "";
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
          email: this.getValidEmail(user?.correo),
          phoneNumber: user?.telefono || "999666333",
          street: "Av. Venezuela 128",
          city: "trujillo",
          state: "Trujillo",
          country: "PE",
          postalCode: "13001",
          document: user?.userName || "12345678",
          documentType:
            user?.userName && user.userName.length > 8
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
      this.formularioIziPayAbierto = true;

      checkout.LoadForm({
        authorization: tokenResponse.response.token,
        keyRSA: "RSA",
        callbackResponse: (response: any) => {
          this.formularioIziPayAbierto = false;
          this.handlePaymentResponse(response);
        },
        callbackError: (error: any) => {
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
          this.formularioIziPayAbierto = false;
          this.showPaymentMessage(
            "El tiempo de espera para el pago ha expirado. Por favor, intente nuevamente.",
            "error",
          );
        }
      }, 300000); // 5 minutos
    } catch (error) {
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

      // Registrar la compra del libro
      this.registrarCompraLibro(response);
    } else if (
      response.code === "504" ||
      response.message?.includes("timeout")
    ) {
      this.showPaymentMessage(
        "La pasarela de pagos no está respondiendo. Por favor, intente nuevamente en unos minutos.",
        "error",
      );
    } else {
      const errorMessage =
        response.message ||
        response.error ||
        "Error desconocido en el procesamiento del pago";
      this.showPaymentMessage(`Error en el pago: ${errorMessage}`, "error");
    }
  }

  private registrarCompraLibro(paymentResponse: any): void {
    const user = this.userData();
    const libro = this.libroData();

    const libroCompradoDto = {
      idRegistro: libro.idRegistro,
      idProducto: libro.idProducto.toString(),
      codigo: user?.userName || "",
      docid: user?.userName || "",
      nombreLibro: libro.nombreProducto,
      idtipod: "03",
      serie: "B012",
      fecha: new Date().toISOString(),
      pCompra: libro.precioCompra,
      pVenta: libro.precioVenta,
      cantidad: 1,
      subTotal: libro.precioVenta,
      operacion: "S",
      estado: "A",
      id_sede: libro?.idSede || 1,
      usuario: "SISTEMAS",
      estadoe: "P",
    };

    this.libroService.registrarLibro(libroCompradoDto).subscribe({
      next: (boletaData: any) => {
        this.showPaymentMessage(
          "¡Compra registrada exitosamente! Generando boleta...",
          "success",
        );

        // Navegar a la boleta con los datos (igual que en registro-matricula)
        setTimeout(() => {
          this.router.navigate(["/boleta-electronica"], {
            state: boletaData, // Pasar los datos directamente, no envueltos
            replaceUrl: false, // Cambiar a false para mantener consistencia
          });
        }, 2000);
      },
      error: (error) => {
        this.showPaymentMessage(
          "Pago exitoso, pero hubo un error al registrar la compra. Contacte soporte.",
          "error",
        );

        // Aún así redirigir después de un tiempo
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

  private isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getValidEmail(emailString: string): string {
    if (!emailString) return "test@example.com";

    // Si contiene múltiples emails separados por " / ", tomar el primero
    const emails = emailString.split(" / ");
    const firstEmail = emails[0].trim();

    // Validar el primer email
    if (this.isValidEmail(firstEmail)) {
      return firstEmail;
    }

    // Si el primer email no es válido, intentar con el segundo si existe
    if (emails.length > 1) {
      const secondEmail = emails[1].trim();
      if (this.isValidEmail(secondEmail)) {
        return secondEmail;
      }
    }

    // Si ningún email es válido, usar el fallback
    return "test@example.com";
  }
}

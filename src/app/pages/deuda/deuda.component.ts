import { Component, inject, OnInit, signal } from "@angular/core";
import { PeriodoService } from "../../services/periodo.service";
import { RegistroService } from "../../services/registro.service";
import { environment } from "../../../environments/environment.development";
import { Router } from "@angular/router";
import { HorarioService } from "../../services/horario.service";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { MatTableModule } from "@angular/material/table";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";

@Component({
  selector: "app-deuda",
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
    MatTableModule,
    MatTableModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: "./deuda.component.html",
  styleUrl: "./deuda.component.scss",
})
export class DeudaComponent implements OnInit {
  resumen: any = null;
  periodoActual = signal<any>(null);
  ultimoRegistro = signal<any>(null);
  user = JSON.parse(localStorage.getItem("alumno_currentUser"));
  procesandoPago = false;
  formularioIziPayAbierto = false; // Nueva propiedad para controlar el estado
  paymentMessage: string = "";
  private izipayLoaded = false;
  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private horarioService = inject(HorarioService);
  private router = inject(Router);
  paymentMessageClass: string = "";
  ngOnInit() {
    //  this.periodoService.ultimos12Periodos().subscribe((periodos: any) => {
    //    if (Array.isArray(periodos) && periodos.length > 0) {
    //      this.periodoActual.set(periodos[0]);
    //    }
    //  });

    //  this.registroService.obtenerUltimoRegistroPorAlumno(this.user.userName)
    //    .subscribe((registro: any) => {
    //      console.log('Último registro obtenido:', registro);
    //      this.ultimoRegistro.set(registro);
    //    //  this.mostrarResumen(registro.idHorario, this.user.userName);
    //    });

    this.mostrarResumen(this.user.userName);
  }

  mostrarResumen(docId: string) {
    this.horarioService.obtenerDeuda(docId).subscribe({
      next: (res: any) => {
        this.resumen = res;
      },
      error: (err) => {
        this.resumen = null;
      },
    });
  }

  procesarPago(precio: number) {
    this.procesandoPago = true;
    this.paymentMessage = "";
    // Pago real
    const transactionId =
      Date.now().toString() + Math.random().toString().substr(2, 5);
    const orderNumber = this.resumen.idHorario + this.user.userName;
    this.registroService
      .obtenerTokenPago(precio, transactionId, orderNumber)
      .subscribe({
        next: (tokenResponse: any) => {
          if (tokenResponse.code === "00") {
            this.initializeIziPay(
              tokenResponse,
              precio,
              transactionId,
              orderNumber,
            );
          } else {
            this.showPaymentMessage("Error al obtener token de pago", "error");
          }
          this.procesandoPago = false;
        },
        error: (err) => {
          this.showPaymentMessage("Error al procesar el pago", "error");
          this.procesandoPago = false;
        },
      });
  }

  private simularPagoExitoso(precio: number): void {
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
        amount: precio,
      };

      this.procesandoPago = false;
      this.handlePaymentResponse(simulatedResponse);
    }, 2000);
  }

  private initializeIziPay(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber: string,
  ) {
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
  ) {
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
          firstName: this.resumen?.nombres || "Juan",
          lastName: this.resumen?.apellidoPaterno || "Perez",
          email: this.resumen?.correo || "test@example.com",
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

      // Bloquear botón cuando se abre el formulario
      this.formularioIziPayAbierto = true;

      checkout.LoadForm({
        authorization: tokenResponse.response.token,
        keyRSA: "RSA",
        callbackResponse: (response: any) => {
          // Desbloquear botón cuando se recibe respuesta
          this.formularioIziPayAbierto = false;
          this.handlePaymentResponse(response);
        },
      });
    } catch (error) {
      this.formularioIziPayAbierto = false; // Desbloquear en caso de error
      this.showPaymentMessage(
        "Error al inicializar el formulario de pago",
        "error",
      );
    }
  }

  private handlePaymentResponse(response: any) {
    if (response.code === "00") {
      this.showPaymentMessage(
        "Pago exitoso. Procesando matrícula...",
        "success",
      );
      const matriculaData = {
        docid: this.user.userName,
        IdHorario: this.resumen.idHorario,
        Costo: this.resumen.costo,
        Modalidad: this.resumen.modalidad,
        Periodo: this.resumen.periodo,
        Curso: this.resumen.curso,
        Turno: this.resumen.turno,
        Aula: this.resumen.aula,
        Profesor: this.resumen.docente,
      };

      this.registroService
        .pagarDeuda(this.resumen.idRegistro, matriculaData)
        .subscribe({
          next: (matriculaResponse: any) => {
            this.showPaymentMessage(
              "¡Matrícula completada exitosamente!",
              "success",
            );

            // Redirigir directamente a la boleta electrónica
            setTimeout(() => {
              this.router.navigate(["/boleta-electronica"], {
                state: matriculaResponse,
                replaceUrl: false,
              });
            }, 1500);
          },
          error: (matriculaError) => {
            this.showPaymentMessage(
              "Error al procesar la matrícula. Contacte soporte.",
              "error",
            );
          },
        });
    } else {
      this.showPaymentMessage(
        `Error en el pago: ${response.message || JSON.stringify(response)}`,
        "error",
      );
    }
  }

  private showPaymentMessage(message: string, type: "success" | "error") {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";
    // Desbloquear botón en caso de error
    if (type === "error") {
      this.formularioIziPayAbierto = false;
    }
  }

  formatearAula(aula: string): string {
    if (!aula) return "";

    const aulaUpper = aula.toUpperCase();

    if (aulaUpper.startsWith("CG")) {
      return `Casa Grande ${aula}`;
    } else if (aulaUpper.startsWith("N")) {
      return `Colegio ${aula}`;
    } else if (aulaUpper.startsWith("P")) {
      return `Porvenir ${aula}`;
    } else if (aulaUpper.startsWith("C")) {
      return `Casona ${aula}`;
    } else if (aulaUpper.startsWith("V")) {
      return `Clase Virtual`;
    } else {
      return `Sede Principal ${aula}`;
    }
  }
}

import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatListModule } from "@angular/material/list";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { HorarioService } from "../../services/horario.service";
import { NiubizService } from "../../services/niubiz.service";
import { environment } from "../../../environments/environment.development";

@Component({
  selector: "app-deuda",
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    PageHeaderComponent,
  ],
  templateUrl: "./deuda.component.html",
  styleUrl: "./deuda.component.scss",
})
export class DeudaComponent implements OnInit {
  resumen: any = null;
  resumenCargado = false;
  user = JSON.parse(localStorage.getItem("alumno_currentUser"));
  private changeDetector = inject(ChangeDetectorRef);
  private pagoEnviado = false;
  procesandoPago = false;
  terminosAceptados = false;
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private sessionKeyActual: string | null = null;

  private horarioService = inject(HorarioService);
  private niubizService = inject(NiubizService);

  ngOnInit() {
    this.cargarCheckoutNiubiz();
    this.mostrarResumen(this.user.userName);
  }

  mostrarResumen(docId: string) {
    this.horarioService.obtenerDeuda(docId).subscribe({
      next: (res: any) => {
        this.resumenCargado = true;
        this.resumen = res && res.costo ? res : null;
      },
      error: (err) => {
        this.resumenCargado = true;
        this.resumen = null;
      },
    });
  }

  procesarPago(precio: number) {
    if (!this.terminosAceptados) return;
    if (this.procesandoPago) return;
    if (!this.resumen) return;

    this.procesandoPago = true;
    this.paymentMessage = "";

    const merchantId = environment.niubiz.merchantId;
    if (!this.obtenerPurchaseNumber()) {
      this.showPaymentMessage(
        "No se pudo generar el número de compra. Intente nuevamente.",
        "error",
      );
      this.procesandoPago = false;
      return;
    }

    this.niubizService
      .prepararYCrearSession(
        {
          purchaseNumber: this.obtenerPurchaseNumber()!,
          amount: precio,
          merchantId,
          tipoOperacion: "deuda",
          docid: this.user?.userName,
          idRegistro: this.resumen?.idRegistro,
        },
        this.user.codigo,
      )
      .subscribe({
        next: (sessionResponse) => {
          this.procesandoPago = false;
          this.sessionKeyActual = sessionResponse.sessionKey;
          this.abrirPagoNiubiz(precio);
        },
        error: (err) => {
          console.error("Error al crear sesión Niubiz", err);
          this.showPaymentMessage("Error al obtener sesión de pago", "error");
          this.procesandoPago = false;
        },
      });
  }

  private abrirPagoNiubiz(amount: number): void {
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
    const docid = this.user?.userName || "";
    const idRegistro = this.resumen?.idRegistro;
    const purchaseNumber = this.obtenerPurchaseNumber();
    if (!purchaseNumber) {
      this.showPaymentMessage(
        "No se pudo obtener el número de compra. Intente nuevamente.",
        "error",
      );
      return;
    }
    const actionUrl = `${environment.apiUrl}Pago/ProcesarPagoDeudaNiubiz/${merchantId}/${idRegistro}/${docid}/${purchaseNumber}`;
    sessionStorage.setItem("niubiz_purchase_number", purchaseNumber);

    w.VisanetCheckout.configure({
      sessiontoken: this.sessionKeyActual,
      channel: "web",
      merchantid: merchantId,
      purchasenumber: purchaseNumber,
      amount: amount,
      expirationminutes: "20",
      timeouturl: `${window.location.origin}/pago-deuda`,
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
        formData.append("order.amount", amount.toFixed(2));
        formData.append("order.currency", "PEN");

        // El backend procesa el pago de la deuda y redirige a
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

  private obtenerPurchaseNumber(): string | null {
    const idRegistro = this.resumen?.idRegistro;
    if (idRegistro === null || idRegistro === undefined || String(idRegistro).trim() === "") {
      return null;
    }

    const purchaseNumber = String(idRegistro).trim();
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

  private showPaymentMessage(message: string, type: "success" | "error") {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";
  }
}

import { CurrencyPipe, DatePipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment.development";
import { HorarioExamen, TipoExamen, vacantesDisponibles } from "../../models/examen";
import { AuthService } from "../../services/auth.service";
import { NiubizService } from "../../services/niubiz.service";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
  selector: "app-resumen-examen",
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: "./resumen-examen.component.html",
  styleUrl: "./resumen-examen.component.scss",
})
export class ResumenExamenComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly niubizService = inject(NiubizService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly horario: HorarioExamen | null = history.state?.horario ?? null;
  readonly tipoExamen: TipoExamen | null = history.state?.tipoExamen ?? null;
  readonly vacantes = vacantesDisponibles;

  terminosAceptados = false;
  cargandoPago = false;
  formularioAbierto = false;
  mensaje = "";
  mensajeClase = "";
  private sessionKey: string | null = null;
  private monto = "0.00";
  pagoEnviado = false;

  ngOnInit(): void {
    this.cargarCheckoutNiubiz();
  }

  volver(): void {
    this.router.navigate(["/examenes"]);
  }

  iniciarPago(): void {
    if (!this.horario || !this.tipoExamen || this.cargandoPago || this.formularioAbierto) return;

    const codigo = this.auth.currentUser()?.codigo;
    if (!Number.isInteger(codigo) || codigo <= 0) {
      this.mostrarMensaje("No se pudo identificar al alumno. Vuelve a iniciar sesión.", "error");
      return;
    }

    const monto = Number(this.horario.costo);
    if (!Number.isFinite(monto) || monto <= 0) {
      this.mostrarMensaje("El horario seleccionado no tiene un costo válido.", "error");
      return;
    }

    this.cargandoPago = true;
    this.mensaje = "";
    const merchantId = environment.niubiz.merchantId;
    const purchaseNumber = this.obtenerPurchaseNumber(codigo);
    if (!purchaseNumber) {
      this.cargandoPago = false;
      this.mostrarMensaje("No se pudo generar el número de compra. Intenta nuevamente.", "error");
      return;
    }

    this.niubizService.prepararYCrearSession({
      purchaseNumber,
      amount: monto,
      merchantId,
      tipoOperacion: "examen",
      docid: this.auth.currentUser()?.userName,
      idHorario: this.horario.idHorarioExamen,
    }, codigo).subscribe({
      next: respuesta => {
        this.cargandoPago = false;
        this.formularioAbierto = true;
        this.sessionKey = respuesta.sessionKey;
        this.monto = monto.toFixed(2);
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.cargandoPago = false;
        this.mostrarMensaje("No se pudo obtener la sesión de pago.", "error");
      },
    });
  }

  abrirPagoNiubiz(): void {
    if (!this.terminosAceptados || this.pagoEnviado || !this.horario || !this.tipoExamen) return;

    const checkout = (window as any).VisanetCheckout;
    const docid = this.auth.currentUser()?.userName;
    const codigo = this.auth.currentUser()?.codigo;
    if (!checkout || !this.sessionKey || !docid || !Number.isInteger(codigo)) {
      this.mostrarMensaje("El formulario de pago aún no está disponible.", "error");
      return;
    }

    const merchantId = environment.niubiz.merchantId;
    const purchaseNumber = this.obtenerPurchaseNumber(codigo);
    if (!purchaseNumber) {
      this.mostrarMensaje("No se pudo generar el número de compra. Intenta nuevamente.", "error");
      return;
    }
    const actionUrl = `${environment.apiUrl}Pago/ProcesarPagoExamenNiubiz/${encodeURIComponent(merchantId)}/${this.horario.idHorarioExamen}/${this.tipoExamen.idTipoExamen}/${encodeURIComponent(docid)}/${encodeURIComponent(purchaseNumber)}`;
    sessionStorage.setItem("niubiz_purchase_number", purchaseNumber);

    checkout.configure({
      sessiontoken: this.sessionKey,
      channel: "web",
      merchantid: merchantId,
      purchasenumber: purchaseNumber,
      amount: Number(this.monto),
      expirationminutes: "20",
      timeouturl: `${window.location.origin}/examenes`,
      merchantlogo: "https://elcultural.edu.pe/images/navbarLogo.png",
      formbuttoncolor: "#1C04A4",
      action: actionUrl,
      complete: (params: any) => {
        if (this.pagoEnviado) return;
        this.pagoEnviado = true;
        this.cargandoPago = true;
        this.changeDetector.detectChanges();

        const form = document.createElement("form");
        form.method = "POST";
        form.action = actionUrl;
        form.style.display = "none";
        const campos = {
          channel: "web",
          "order.tokenId": params.transactionToken || "",
          "order.purchaseNumber": purchaseNumber,
          "order.amount": this.monto,
          "order.currency": "PEN",
        };
        Object.entries(campos).forEach(([nombre, valor]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = nombre;
          input.value = valor;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      },
    });
    checkout.open();
  }

  private obtenerPurchaseNumber(codigo: number): string | null {
    const idHorario = this.horario?.idHorarioExamen;
    if (
      idHorario === null ||
      idHorario === undefined ||
      codigo === null ||
      codigo === undefined ||
      String(idHorario).trim() === "" ||
      String(codigo).trim() === ""
    ) {
      return null;
    }

    const purchaseNumber = `${idHorario}${codigo}`.trim();
    return purchaseNumber || null;
  }

  actualizarAceptacion(aceptada: boolean): void {
    this.terminosAceptados = aceptada;
  }

  private cargarCheckoutNiubiz(): void {
    const checkout = (window as any).VisanetCheckout;
    if (checkout || document.getElementById("niubizCheckoutScript")) return;

    const script = document.createElement("script");
    script.id = "niubizCheckoutScript";
    script.type = "text/javascript";
    script.src = environment.niubiz.scriptUrl;
    document.head.appendChild(script);
  }

  private mostrarMensaje(mensaje: string, clase: "success" | "error"): void {
    this.mensaje = mensaje;
    this.mensajeClase = clase;
  }
}

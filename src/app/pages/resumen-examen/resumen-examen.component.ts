import { CurrencyPipe, DatePipe } from "@angular/common";
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize, switchMap, throwError } from "rxjs";
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
import { AlumnoService } from "../../services/alumno.service";
import { RegistroService } from "../../services/registro.service";
import { NotaRegistroItem } from "../../models/notas-registro";

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
  private readonly alumnoService = inject(AlumnoService);
  private readonly registroService = inject(RegistroService);
  private readonly destroyRef = inject(DestroyRef);

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
  notas: NotaRegistroItem[] = [];
  idItemsSeleccionados: number[] = Array.isArray(history.state?.idItems) ? [...history.state.idItems] : [];
  cargandoNotas = false;
  errorNotas = "";
  cursoActual = "";

  get esRezagado(): boolean {
    return this.tipoExamen?.abreviatura?.trim().toUpperCase() === "R";
  }

  get actividadesSeleccionadas(): NotaRegistroItem[] {
    return this.notas.filter(nota => this.idItemsSeleccionados.includes(nota.idItem) && nota.tieneNota === false);
  }

  get actividadValida(): boolean {
    return !this.esRezagado || (this.idItemsSeleccionados.length >= 1 && this.idItemsSeleccionados.length <= 2 &&
      new Set(this.idItemsSeleccionados).size === this.idItemsSeleccionados.length &&
      this.actividadesSeleccionadas.length === this.idItemsSeleccionados.length);
  }

  ngOnInit(): void {
    this.cargarCheckoutNiubiz();
    if (this.esRezagado) this.cargarNotas();
  }

  cargarNotas(): void {
    if (!this.esRezagado || this.cargandoNotas || this.cargandoPago || this.formularioAbierto) return;
    const idItems = [...this.idItemsSeleccionados];
    this.idItemsSeleccionados = [];
    this.notas = [];
    this.errorNotas = "";
    const documento = this.auth.currentUser()?.userName;
    if (!documento) {
      this.errorNotas = "No se pudo identificar al alumno. Vuelve a iniciar sesión.";
      return;
    }
    this.cargandoNotas = true;
    this.registroService.obtenerUltimoRegistroPorAlumno(documento).pipe(
      switchMap(registro => {
        if (!registro?.idHorario || !registro.idRegistro) {
          return throwError(() => new Error("Sin curso actual"));
        }
        this.cursoActual = registro.curso;
        return this.alumnoService.obtenerNotasRegistro(registro.idHorario, registro.idRegistro, true);
      }),
      finalize(() => {
        this.cargandoNotas = false;
        this.changeDetector.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: detalle => {
        this.notas = Array.isArray(detalle.items) ? detalle.items : [];
        if (this.notas.some(nota => typeof nota.tieneNota !== "boolean")) {
          this.notas = [];
          this.errorNotas = "El servicio de notas debe actualizarse para identificar las notas pendientes.";
          return;
        }
        this.idItemsSeleccionados = idItems;
        if (!this.actividadValida) {
          this.errorNotas = "Vuelve a horarios y selecciona una o dos actividades pendientes antes de continuar con el pago.";
        }
      },
      error: () => this.errorNotas = "No se pudieron cargar las notas del curso actual. Intenta nuevamente.",
    });
  }

  seleccionarNota(nota: NotaRegistroItem): void {
    if (this.cargandoNotas || this.cargandoPago || this.formularioAbierto || this.pagoEnviado ||
        !this.notas.includes(nota) || nota.tieneNota !== false) return;
    const ids = this.idItemsSeleccionados;
    if (!ids.includes(nota.idItem) && ids.length >= 2) return;
    this.idItemsSeleccionados = ids.includes(nota.idItem)
      ? ids.filter(id => id !== nota.idItem) : [...ids, nota.idItem];
  }

  volver(): void {
    this.router.navigate(["/examenes"]);
  }

  iniciarPago(): void {
    if (!this.horario || !this.tipoExamen || this.cargandoPago || this.formularioAbierto || this.pagoEnviado || !this.terminosAceptados) return;
    if (!this.actividadValida || this.cargandoNotas || !!this.errorNotas) {
      this.mostrarMensaje("Selecciona una o dos notas pendientes para rendir el examen rezagado.", "error");
      return;
    }

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
      idTipoExamen: this.tipoExamen.idTipoExamen,
      ...(this.esRezagado ? { idItems: [...this.idItemsSeleccionados] } : {}),
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
    if (!this.actividadValida) {
      this.mostrarMensaje("Selecciona una o dos notas pendientes para rendir el examen rezagado.", "error");
      return;
    }

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
    const idItems = this.esRezagado ? [...this.idItemsSeleccionados] : [];
    const query = new URLSearchParams();
    idItems.forEach(id => query.append("idItems", String(id)));
    const actionUrl = `${environment.apiUrl}Pago/ProcesarPagoExamenNiubiz/${encodeURIComponent(merchantId)}/${this.horario.idHorarioExamen}/${this.tipoExamen.idTipoExamen}/${encodeURIComponent(docid)}/${encodeURIComponent(purchaseNumber)}` +
      (idItems.length ? `?${query.toString()}` : "");
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
        idItems.forEach(id => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "idItems";
          input.value = String(id);
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

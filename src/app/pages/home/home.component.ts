import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { TeamsDialogComponent } from "../../components/teams-dialog/teams-dialog.component";
import { GmailDialogComponent } from "../../components/gmail-dialog/gmail-dialog.component";
import { AlumnoService } from "../../services/alumno.service";
import { SnackService } from "../../services/snack.service";
import { UbigeoService } from "../../services/ubigeo.service";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDividerModule } from "@angular/material/divider";
import {
  UbigeoDepartment,
  UbigeoProvince,
  UbigeoDistrict,
} from "../../models/ubigeo";
import { EventoService } from "../../services/evento.service";
import { EventoDialogComponent } from "./evento-dialog.component";
@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    PageHeaderComponent,
    CommonModule,
    MatTabsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private snack = inject(SnackService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private ubigeoService = inject(UbigeoService);
  eventos: any[] = [];
  private eventoService = inject(EventoService);
  // Patrón simple para celular peruano según tu requerimiento:
  // - Prefijo opcional: '+51' o '51' (el '+' es opcional)
  // - Luego debe empezar con '9' y tener 9 dígitos en total (ej.: 987654321, 51987654321, +51987654321)
  celularPattern: RegExp = /^(?:\+?51)?9\d{8}$/;

  perfilForm: FormGroup = this.fb.group({
    nombre: ["", Validators.required],
    apePaterno: ["", Validators.required],
    apeMaterno: [""],
    completo: [""],
    codigo: [""],
    docid: ["", Validators.required],
    direccion: ["", Validators.required],
    email: ["", [Validators.email, Validators.required]],
    fechanac: [""],
    sexo: [""],
    seguro: ["", Validators.required],
    brazoDominante: ["", Validators.required],
    tipodoc: [""],
    persona: [""], // Campo administrativo, no editable por usuario
    alergia: [""],
    id_teams: [""], // Campo administrativo, no editable por usuario
    departamento: [""],
    provincia: [""],
    distrito: ["", Validators.required],
    enteramiento: ["", Validators.required],

    permiteLlamadas: [false],
    permiteCorreos: [false],
    permiteWhatsapp: [false],
    // Telefonos: permitir múltiples entradas como FormArray (cada entrada tiene numeroTfno, tipoTfno e idTlfno)
    telefonos: this.fb.array(
      [
        this.fb.group({
          numeroTfno: ["", [Validators.pattern(this.celularPattern)]],
          tipoTfno: [""],
          personaTfno: ["", Validators.required],
          idTlfno: [""],
        }),
      ],
      [HomeComponent.atLeastOnePhoneValidator],
    ),
    // Apoderados: es un FormGroup que maneja 2 apoderados (estructura del backend)
    apoderados: this.fb.group({
      nombre1Apo: [""],
      nombre2Apo: [""],
      apellidos1Apo: [""],
      apellidos2Apo: [""],
      tipo1Apo: [""],
      tipo2Apo: [""],
      email1Apo: ["", Validators.email],
      email2Apo: ["", Validators.email],
      tfno1Apo: ["", Validators.pattern(this.celularPattern)],
      tfno2Apo: ["", Validators.pattern(this.celularPattern)],
    }),
  });

  // Mantener el objeto original por si hace falta comparar
  perfilOriginal: any = null;

  // Avatar: iniciales y color generado
  avatarInitials: string = "";
  avatarColor: string = ""; // css color (ej. hsl(...))

  // Propiedad para manejar idteams
  idteams: string | null = null;

  // Estado de carga para actualización
  isUpdating: boolean = false;

  // Propiedades para ubigeo
  departamentos: UbigeoDepartment[] = [];
  provincias: UbigeoProvince[] = [];
  distritos: UbigeoDistrict[] = [];

  // IDs por defecto para La Libertad, Trujillo, Trujillo
  readonly DEFAULT_DEPARTMENT_ID = "13"; // La Libertad
  readonly DEFAULT_PROVINCE_ID = "1301"; // Trujillo
  readonly DEFAULT_DISTRICT_ID = "130101"; // Trujillo

  // Estados de carga para ubigeo
  loadingDepartamentos = false;
  loadingProvincias = false;
  loadingDistritos = false;

  // Método para mostrar errores de validación específicos
  mostrarErroresValidacion(): void {
    const erroresDatosPersonales: string[] = [];
    const erroresTelefonos: string[] = [];
    const erroresApoderados: string[] = [];
    const erroresInformacionAdicional: string[] = [];

    // Validar campos básicos - Datos Personales
    if (this.perfilForm.get("nombre")?.hasError("required")) {
      erroresDatosPersonales.push("• El nombre es requerido");
    }

    if (this.perfilForm.get("apePaterno")?.hasError("required")) {
      erroresDatosPersonales.push("• El apellido paterno es requerido");
    }

    if (this.perfilForm.get("docid")?.hasError("required")) {
      erroresDatosPersonales.push("• El documento de identidad es requerido");
    }

    if (this.perfilForm.get("direccion")?.hasError("required")) {
      erroresDatosPersonales.push("• La dirección es requerida");
    }

    if (this.perfilForm.get("email")?.hasError("required")) {
      erroresDatosPersonales.push("• El email es requerido");
    } else if (this.perfilForm.get("email")?.hasError("email")) {
      erroresDatosPersonales.push("• El formato del email no es válido");
    }

    // Validar que al menos un teléfono sea proporcionado
    if (this.perfilForm.get("telefonos")?.hasError("atLeastOnePhone")) {
      erroresTelefonos.push(
        "• Debe proporcionar al menos un número de teléfono",
      );
    }

    // Validar teléfonos individuales
    const telefonosArray = this.perfilForm.get("telefonos") as FormArray;
    telefonosArray.controls.forEach((telefonoGroup, index) => {
      const numeroTfno = telefonoGroup.get("numeroTfno");
      const personaTfno = telefonoGroup.get("personaTfno");

      if (personaTfno?.hasError("required")) {
        erroresTelefonos.push(
          `• Teléfono ${index + 1}: La persona es requerida`,
        );
      }

      if (numeroTfno?.hasError("pattern") && numeroTfno.value) {
        erroresTelefonos.push(
          `• Teléfono ${index + 1}: Formato inválido (ej: 987654321, +51987654321)`,
        );
      }
    });

    // Validar apoderados
    const apoderadosGroup = this.perfilForm.get("apoderados") as FormGroup;

    const email1Apo = apoderadosGroup.get("email1Apo");
    if (email1Apo?.hasError("email") && email1Apo.value) {
      erroresApoderados.push("• Email del Apoderado 1: Formato no válido");
    }

    const email2Apo = apoderadosGroup.get("email2Apo");
    if (email2Apo?.hasError("email") && email2Apo.value) {
      erroresApoderados.push("• Email del Apoderado 2: Formato no válido");
    }

    const tfno1Apo = apoderadosGroup.get("tfno1Apo");
    if (tfno1Apo?.hasError("pattern") && tfno1Apo.value) {
      erroresApoderados.push(
        "• Teléfono del Apoderado 1: Formato inválido (ej: 987654321, +51987654321)",
      );
    }

    const tfno2Apo = apoderadosGroup.get("tfno2Apo");
    if (tfno2Apo?.hasError("pattern") && tfno2Apo.value) {
      erroresApoderados.push(
        "• Teléfono del Apoderado 2: Formato inválido (ej: 987654321, +51987654321)",
      );
    }

    // Validar campos de información adicional

    if (this.perfilForm.get("brazoDominante")?.hasError("required")) {
      erroresInformacionAdicional.push("• El brazo dominante es requerido");
    }

    if (this.perfilForm.get("distrito")?.hasError("required")) {
      erroresInformacionAdicional.push("• El distrito es requerido");
    }

    if (this.perfilForm.get("seguro")?.hasError("required")) {
      erroresInformacionAdicional.push("• El seguro es requerido");
    }

    if (this.perfilForm.get("enteramiento")?.hasError("required")) {
      erroresInformacionAdicional.push("• El enteramiento es requerido");
    }

    // Construir mensaje organizado
    let mensajeCompleto =
      "No se puede actualizar el perfil. Corrija los siguientes errores:\n\n";

    if (erroresDatosPersonales.length > 0) {
      mensajeCompleto +=
        "📋 DATOS PERSONALES:\n" + erroresDatosPersonales.join("\n") + "\n\n";
    }

    if (erroresTelefonos.length > 0) {
      mensajeCompleto +=
        "📞 TELÉFONOS:\n" + erroresTelefonos.join("\n") + "\n\n";
    }

    if (erroresApoderados.length > 0) {
      mensajeCompleto +=
        "👥 APODERADOS:\n" + erroresApoderados.join("\n") + "\n\n";
    }

    if (erroresInformacionAdicional.length > 0) {
      mensajeCompleto +=
        "ℹ️ INFORMACIÓN ADICIONAL:\n" +
        erroresInformacionAdicional.join("\n") +
        "\n\n";
    }

    // Mostrar errores encontrados
    const totalErrores =
      erroresDatosPersonales.length +
      erroresTelefonos.length +
      erroresApoderados.length +
      erroresInformacionAdicional.length;
    if (totalErrores > 0) {
      mensajeCompleto += `Total: ${totalErrores} error${totalErrores > 1 ? "es" : ""} encontrado${totalErrores > 1 ? "s" : ""}`;
      this.snack.danger(mensajeCompleto, { duration: 8000 });
    } else {
      this.snack.danger(
        "El formulario contiene errores. Por favor, revise todos los campos.",
      );
    }

    // Marcar todos los campos como touched para mostrar errores en la UI
    this.perfilForm.markAllAsTouched();

    // Resaltar visualmente los campos con errores
    this.resaltarCamposConErrores();
  }

  // Método para resaltar visualmente los campos con errores
  private resaltarCamposConErrores(): void {
    setTimeout(() => {
      // Resaltar campos básicos con errores
      const camposBasicos = ["nombre", "apePaterno", "docid", "email"];
      camposBasicos.forEach((campo) => {
        const control = this.perfilForm.get(campo);
        if (control?.invalid) {
          const elemento = document.querySelector(
            `[formControlName="${campo}"]`,
          );
          if (elemento) {
            elemento.scrollIntoView({ behavior: "smooth", block: "center" });
            return; // Solo hacer scroll al primer error encontrado
          }
        }
      });

      // Si no hay errores en campos básicos, revisar teléfonos
      const telefonosArray = this.perfilForm.get("telefonos") as FormArray;
      for (let i = 0; i < telefonosArray.controls.length; i++) {
        const telefonoGroup = telefonosArray.controls[i];
        if (telefonoGroup.invalid) {
          const elemento = document.querySelector(
            `[formArrayName="telefonos"] [formGroupName="${i}"]`,
          );
          if (elemento) {
            elemento.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
        }
      }

      // Si no hay errores en teléfonos, revisar apoderados
      const apoderadosGroup = this.perfilForm.get("apoderados") as FormGroup;
      if (apoderadosGroup.invalid) {
        const elemento = document.querySelector('[formGroupName="apoderados"]');
        if (elemento) {
          elemento.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  }

  // Método para verificar si la pestaña de datos personales tiene errores
  get tieneErroresDatosPersonales(): boolean {
    return (
      this.perfilForm.get("nombre")?.invalid ||
      this.perfilForm.get("apePaterno")?.invalid ||
      this.perfilForm.get("docid")?.invalid ||
      this.perfilForm.get("direccion")?.invalid ||
      this.perfilForm.get("email")?.invalid ||
      this.telefonos.invalid
    );
  }

  // Método para verificar si la pestaña de apoderados tiene errores
  get tieneErroresApoderados(): boolean {
    return this.perfilForm.get("apoderados")?.invalid || false;
  }

  // Método para obtener el conteo de errores en datos personales
  get conteoErroresDatosPersonales(): number {
    let errores = 0;

    if (this.perfilForm.get("nombre")?.invalid) errores++;
    if (this.perfilForm.get("apePaterno")?.invalid) errores++;
    if (this.perfilForm.get("docid")?.invalid) errores++;
    if (this.perfilForm.get("direccion")?.invalid) errores++;
    if (this.perfilForm.get("email")?.invalid) errores++;

    // Contar errores en teléfonos
    if (this.telefonos.hasError("atLeastOnePhone")) errores++;
    this.telefonos.controls.forEach((telefonoControl) => {
      if (telefonoControl.invalid) errores++;
    });

    return errores;
  }

  // Método para obtener el conteo de errores en apoderados
  get conteoErroresApoderados(): number {
    let errores = 0;
    const apoderadosGroup = this.perfilForm.get("apoderados") as FormGroup;

    if (apoderadosGroup.get("email1Apo")?.invalid) errores++;
    if (apoderadosGroup.get("email2Apo")?.invalid) errores++;
    if (apoderadosGroup.get("tfno1Apo")?.invalid) errores++;
    if (apoderadosGroup.get("tfno2Apo")?.invalid) errores++;

    return errores;
  }

  // Método para verificar si la pestaña de información adicional tiene errores
  get tieneErroresInformacionAdicional(): boolean {
    return (
      this.perfilForm.get("brazoDominante")?.invalid ||
      this.perfilForm.get("departamento")?.invalid ||
      this.perfilForm.get("provincia")?.invalid ||
      this.perfilForm.get("distrito")?.invalid ||
      this.perfilForm.get("seguro")?.invalid ||
      this.perfilForm.get("enteramiento")?.invalid ||
      false
    );
  }

  // Método para obtener el conteo de errores en información adicional
  get conteoErroresInformacionAdicional(): number {
    let errores = 0;

    if (this.perfilForm.get("brazoDominante")?.invalid) errores++;
    if (this.perfilForm.get("departamento")?.invalid) errores++;
    if (this.perfilForm.get("provincia")?.invalid) errores++;
    if (this.perfilForm.get("distrito")?.invalid) errores++;
    if (this.perfilForm.get("seguro")?.invalid) errores++;
    if (this.perfilForm.get("enteramiento")?.invalid) errores++;

    return errores;
  }

  // Validador personalizado para requerir al menos un teléfono
  static atLeastOnePhoneValidator(
    control: AbstractControl,
  ): { [key: string]: any } | null {
    const formArray = control as FormArray;
    if (!formArray || formArray.length === 0) {
      return { atLeastOnePhone: true };
    }

    const hasValidPhone = formArray.controls.some((phoneGroup) => {
      const numeroTfno = phoneGroup.get("numeroTfno")?.value;
      return numeroTfno && numeroTfno.trim().length > 0;
    });

    return hasValidPhone ? null : { atLeastOnePhone: true };
  }

  // Métodos para manejo de ubigeo
  private cargarDepartamentos(): void {
    this.cargarUbigeoDesdeBackend();
  }

  eventosDesdeAhora() {
    this.eventoService.listarEventosDesdeAhora().subscribe((eventos) => {
      this.eventos = eventos as any[];
    });
  }

  onDepartamentoChange(departamentoId: string): void {
    if (!departamentoId) {
      this.provincias = [];
      this.distritos = [];
      this.perfilForm.get("provincia")?.setValue("");
      this.perfilForm.get("distrito")?.setValue("");
      return;
    }

    this.loadingProvincias = true;
    this.ubigeoService.getProvincesByDepartment(departamentoId).subscribe({
      next: (provincias) => {
        this.provincias = provincias;
        this.distritos = [];
        this.loadingProvincias = false;

        // Si es La Libertad, establecer Trujillo por defecto
        if (departamentoId === this.DEFAULT_DEPARTMENT_ID) {
          this.perfilForm.get("provincia")?.setValue(this.DEFAULT_PROVINCE_ID);
          this.onProvinciaChange(this.DEFAULT_PROVINCE_ID);
        } else {
          this.perfilForm.get("provincia")?.setValue("");
          this.perfilForm.get("distrito")?.setValue("");
        }
      },
      error: (error) => {
        console.error("Error al cargar provincias:", error);
        this.loadingProvincias = false;
        this.snack.danger("Error al cargar provincias");
      },
    });
  }

  onProvinciaChange(provinciaId: string): void {
    if (!provinciaId) {
      this.distritos = [];
      this.perfilForm.get("distrito")?.setValue("");
      return;
    }

    this.loadingDistritos = true;
    this.ubigeoService.getDistrictsByProvince(provinciaId).subscribe({
      next: (distritos) => {
        this.distritos = distritos;
        this.loadingDistritos = false;

        // Si es Trujillo, establecer Trujillo por defecto
        if (provinciaId === this.DEFAULT_PROVINCE_ID) {
          this.perfilForm.get("distrito")?.setValue(this.DEFAULT_DISTRICT_ID);
        } else {
          this.perfilForm.get("distrito")?.setValue("");
        }
      },
      error: (error) => {
        console.error("Error al cargar distritos:", error);
        this.loadingDistritos = false;
        this.snack.danger("Error al cargar distritos");
      },
    });
  }

  private cargarUbigeoDesdeBackend(distritoNombre?: string): void {
    this.loadingDepartamentos = true;
    this.ubigeoService.getDepartments().subscribe({
      next: (departamentos) => {
        this.departamentos = departamentos;
        this.loadingDepartamentos = false;

        if (!distritoNombre) {
          // Si no hay distrito guardado, NO inicializar nada
          // El usuario debe completar departamento, provincia y distrito manualmente
          // No hacer nada aquí
        } else {
          // Si hay distrito guardado, buscar su información completa
          this.buscarDistritoPorNombre(distritoNombre);
        }
      },
      error: (error) => {
        console.error("Error al cargar departamentos:", error);
        this.loadingDepartamentos = false;
        this.snack.danger("Error al cargar departamentos");
        // En caso de error, no inicializar nada
      },
    });
  }

  private establecerValoresPorDefecto(): void {
    this.perfilForm.get("departamento")?.setValue(this.DEFAULT_DEPARTMENT_ID);
    this.onDepartamentoChange(this.DEFAULT_DEPARTMENT_ID);
  }

  private buscarDistritoPorNombre(nombreDistrito: string): void {
    // Buscar en todos los departamentos el distrito con ese nombre
    // Como puede haber distritos con el mismo nombre en diferentes provincias,
    // priorizamos La Libertad
    this.ubigeoService
      .getDistrictsByDepartment(this.DEFAULT_DEPARTMENT_ID)
      .subscribe({
        next: (distritos) => {
          const distritoEncontrado = distritos.find(
            (d) => d.name.toLowerCase() === nombreDistrito.toLowerCase(),
          );

          if (distritoEncontrado) {
            // Cargar la jerarquía completa
            this.cargarJerarquiaCompleta(distritoEncontrado);
          } else {
            // Si no se encuentra, usar valores por defecto
            this.establecerValoresPorDefecto();
          }
        },
        error: (error) => {
          console.error("Error al buscar distrito:", error);
          this.establecerValoresPorDefecto();
        },
      });
  }

  private cargarJerarquiaCompleta(distrito: UbigeoDistrict): void {
    // Establecer departamento
    this.perfilForm.get("departamento")?.setValue(distrito.departmentId);

    // Cargar provincias del departamento
    this.ubigeoService
      .getProvincesByDepartment(distrito.departmentId)
      .subscribe({
        next: (provincias) => {
          this.provincias = provincias;
          this.perfilForm.get("provincia")?.setValue(distrito.provinceId);

          // Cargar distritos de la provincia
          this.ubigeoService
            .getDistrictsByProvince(distrito.provinceId)
            .subscribe({
              next: (distritos) => {
                this.distritos = distritos;
                this.perfilForm.get("distrito")?.setValue(distrito.id);
              },
              error: (error) => {
                console.error("Error al cargar distritos:", error);
              },
            });
        },
        error: (error) => {
          console.error("Error al cargar provincias:", error);
        },
      });
  }

  // Método para obtener el nombre del distrito seleccionado
  private getSelectedDistrictName(): string {
    const distritoId = this.perfilForm.get("distrito")?.value;
    if (!distritoId) return "";

    const distrito = this.distritos.find((d) => d.id === distritoId);
    return distrito?.name || "";
  }

  // Getter para detectar si hay cambios en el formulario
  get hasChanges(): boolean {
    if (!this.perfilOriginal) return false;

    const currentValues = this.perfilForm.value;

    // Comparar campos básicos de texto
    const basicFields = [
      "nombre",
      "apePaterno",
      "apeMaterno",
      "direccion",
      "email",
      "seguro",
      "fechanac",
      "sexo",
      "brazoDominante",
      "tipodoc",
      "persona",
      "alergia",
      "id_teams",
      "enteramiento",
    ];

    for (const field of basicFields) {
      const current = currentValues[field] || "";
      const original = this.perfilOriginal[field] || "";
      if (current !== original) return true;
    }

    // Comparar ubigeo - comparamos el nombre del distrito seleccionado con el original
    const currentDistrictName = this.getSelectedDistrictName();
    const originalDistrictName = this.perfilOriginal.distrito || "";
    if (currentDistrictName !== originalDistrictName) return true;

    // Comparar campos booleanos de permisos
    const permissionFields = [
      "permiteLlamadas",
      "permiteCorreos",
      "permiteWhatsapp",
    ];

    for (const field of permissionFields) {
      const current = currentValues[field] || false;
      const original = this.perfilOriginal[field] || false;
      if (current !== original) return true;
    }

    // Comparar teléfonos
    const currentTelefonos = currentValues.telefonos || [];
    const originalTelefonos = this.perfilOriginal.telefonos || [];

    if (currentTelefonos.length !== originalTelefonos.length) return true;

    for (let i = 0; i < currentTelefonos.length; i++) {
      const tel = currentTelefonos[i];
      const original = originalTelefonos[i];
      if (!original) return true;

      if (
        (tel.numeroTfno || "") !== (original.numeroTfno || "") ||
        (tel.tipoTfno || "") !== (original.tipoTfno || "") ||
        (tel.personaTfno || "") !== (original.personaTfno || "")
      ) {
        return true;
      }
    }

    // Comparar apoderados
    const currentApoderados = currentValues.apoderados || {};
    const originalApoderados = this.perfilOriginal.apoderado || {};

    const apoderadoFields = [
      "nombre1Apo",
      "nombre2Apo",
      "apellidos1Apo",
      "apellidos2Apo",
      "tipo1Apo",
      "tipo2Apo",
      "email1Apo",
      "email2Apo",
      "tfno1Apo",
      "tfno2Apo",
    ];

    for (const field of apoderadoFields) {
      const current = currentApoderados[field] || "";
      const original = originalApoderados[field] || "";
      if (current !== original) return true;
    }

    return false;
  }

  // Método equivalente al de navbar: toma el nombre completo y devuelve hasta 2 iniciales
  get userInitials(): string {
    const nombreCompleto = (
      this.perfilForm.get("completo")?.value || ""
    ).toString();
    return nombreCompleto
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase())
      .join("")
      .slice(0, 2); // Solo dos iniciales
  }

  // Getter para acceder al FormArray en plantilla / código
  get telefonos(): FormArray {
    return this.perfilForm.get("telefonos") as FormArray;
  }

  get apoderados(): FormGroup {
    return this.perfilForm.get("apoderados") as FormGroup;
  }

  // Helper para limpiar espacios de números de teléfono
  private limpiarNumeroTelefono(numero: string): string {
    if (!numero) return "";
    return numero.replace(/\s+/g, ""); // Remueve todos los espacios
  }

  // Helper para crear un grupo de teléfono
  private crearTelefono(
    numero: string = "",
    tipo: string = "",
    persona: string = "",
    idTlfno: string = "",
  ): FormGroup {
    return this.fb.group({
      numeroTfno: [numero, [Validators.pattern(this.celularPattern)]],
      tipoTfno: [tipo],
      personaTfno: [persona, Validators.required],
      Idtfno: [idTlfno],
    });
  }

  // Intentamos leer el usuario guardado (puede variar según la app)
  user = JSON.parse(localStorage.getItem("alumno_currentUser") || "{}");

  ngOnInit(): void {
    // Ensure apoderados/telefonos getters reference existing FormArrays (form is already created above)
    // cargarPerfil() will repopulate the arrays based on backend data
    this.cargarPerfil();
    this.eventosDesdeAhora();
  }

  private obtenerDniDeUsuario(): string {
    // El objeto user puede tener distintas propiedades; intentamos varios lugares comunes
    if (!this.user || Object.keys(this.user).length === 0) {
      return "45551179"; // fallback temporal
    }
    return (
      (this.user.userName as string) ||
      (this.user.dni as string) ||
      (this.user.docid as string) ||
      (this.user.username as string) ||
      "45551179"
    );
  }

  cargarPerfil() {
    const dni = this.obtenerDniDeUsuario();

    this.alumnoService.getPerfil(dni).subscribe({
      next: (perfil: any) => {
        console.log(perfil);
        // Guardamos el original
        this.perfilOriginal = perfil;

        // Rellenamos formulario con datos recibidos (seguro con fallback a strings vacíos)
        this.perfilForm.patchValue({
          nombre: perfil.nombre || "",
          apePaterno: perfil.apePaterno || "",
          apeMaterno: perfil.apeMaterno || "",
          completo:
            perfil.completo ||
            `${perfil.apePaterno || ""} ${perfil.apeMaterno || ""} ${perfil.nombre || ""}`.trim(),
          codigo: perfil.codigo ?? "",
          docid: perfil.docid ?? perfil.persona?.docid ?? "",
          direccion: perfil.direccion || "",
          email: perfil.email || "",
          fechanac: perfil.fechanac ? this.formatFecha(perfil.fechanac) : "",
          sexo: perfil.sexo || "",
          seguro: perfil.seguro || "",
          brazoDominante: perfil.brazoDominante || "",
          tipodoc: perfil.tipodoc || null,
          persona: perfil.persona || "",
          alergia: perfil.alergia || "",
          id_teams: perfil.id_teams || "",
          enteramiento: perfil.enteramiento || "",
          permiteLlamadas: perfil.permiteLlamadas || false,
          permiteCorreos: perfil.permiteCorreos || false,
          permiteWhatsapp: perfil.permiteWhatsapp || false,
        });

        // Cargar ubigeo basado en el distrito guardado
        this.cargarUbigeoDesdeBackend(perfil.distrito);

        // Obtener idteams del perfil
        this.idteams = perfil.id_teams || null;

        // Calcular avatar a partir del nombre completo y un seed (docid/codigo)
        this.computeAvatar();

        // Telefonos: si vienen, reemplazamos el FormArray con los teléfonos recibidos (permitir varios)
        if (perfil.telefonos && Array.isArray(perfil.telefonos)) {
          const fa = this.perfilForm.get("telefonos") as FormArray;
          // limpiar el FormArray actual
          while (fa && fa.length) {
            fa.removeAt(0);
          }
          // agregar cada teléfono recibido como FormGroup
          (perfil.telefonos as any[]).forEach((t) => {
            fa.push(
              this.fb.group({
                numeroTfno: [
                  this.limpiarNumeroTelefono(t.numeroTfno || ""),
                  Validators.pattern(this.celularPattern),
                ],
                tipoTfno: [t.tipoTfno || ""],
                personaTfno: [t.personaTfno || "Alumno", Validators.required],
                idTlfno: [t.idTlfno || ""],
              }),
            );
          });
        }

        // Apoderados: poblar FormGroup desde backend (objeto 'apoderado')
        if (perfil.apoderado) {
          const a = perfil.apoderado;
          this.perfilForm.get("apoderados")?.patchValue({
            nombre1Apo: a.nombre1Apo || "",
            nombre2Apo: a.nombre2Apo || "",
            apellidos1Apo: a.apellidos1Apo || "",
            apellidos2Apo: a.apellidos2Apo || "",
            tipo1Apo: a.tipo1Apo || "",
            tipo2Apo: a.tipo2Apo || "",
            email1Apo: a.email1Apo || "",
            email2Apo: a.email2Apo || "",
            tfno1Apo: this.limpiarNumeroTelefono(a.tfno1Apo || ""),
            tfno2Apo: this.limpiarNumeroTelefono(a.tfno2Apo || ""),
          });
        }
      },
      error: (err) => {
        console.error("Error al obtener perfil del alumno:", err);
      },
    });
  }

  private formatFecha(fechaIso: string): string {
    // Convierte '1988-12-13T00:00:00' a '1988-12-13' para bindear en input tipo date
    if (!fechaIso) return "";
    const parts = fechaIso.split("T");
    return parts[0];
  }

  private computeAvatar(): void {
    const completo = (this.perfilForm.get("completo")?.value || "")
      .toString()
      .trim();
    const parts = completo.split(/\s+/).filter(Boolean);
    let initials = "";
    if (parts.length === 0) {
      initials = "";
    } else if (parts.length === 1) {
      initials = parts[0].substring(0, 2).toUpperCase();
    } else {
      initials = (parts[0][0] + (parts[1][0] || "")).toUpperCase();
    }
    this.avatarInitials = initials;

    const seed = (
      this.perfilForm.get("docid")?.value ||
      this.perfilForm.get("codigo")?.value ||
      ""
    ).toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const hue = Math.abs(hash) % 360;
    this.avatarColor = `hsl(${hue} 65% 45%)`;
  }

  // Método utilitario para obtener el mensaje de error del teléfono basado en patrón (control único, mantenido para compatibilidad)
  getTelefonoErrorMessage(): string | null {
    const control = this.perfilForm.get("telefono");
    if (!control || !control.errors) return null;

    if (control.hasError("required")) {
      return "Teléfono es requerido";
    }

    if (control.hasError("pattern")) {
      // Mensaje que explica el patrón que solicitaste
      return "Teléfono inválido. Debe (opcionalmente) comenzar con +51 o 51 y luego empezar con 9 y tener 9 dígitos en total. Ejemplos válidos: 987654321, 51987654321, +51987654321";
    }

    return null;
  }

  // Helper genérico para obtener el mensaje de error de un control de teléfono (usado por el FormArray de teléfonos)
  getPhoneControlErrorMessage(control: AbstractControl | null): string | null {
    if (!control || !control.errors) return null;

    if (control.hasError("required")) {
      return "Teléfono es requerido";
    }

    if (control.hasError("pattern")) {
      return "Teléfono inválido. Debe (opcionalmente) comenzar con +51 o 51 y luego empezar con 9 y tener 9 dígitos en total. Ejemplos válidos: 987654321, 51987654321, +51987654321";
    }

    return null;
  }

  onApoderadoPhoneInput(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    const cleanedValue = this.limpiarNumeroTelefono(target.value);

    // Actualizar el valor del formulario sin espacios
    this.perfilForm
      .get("apoderados")
      ?.get(fieldName)
      ?.setValue(cleanedValue, { emitEvent: false });

    // Actualizar el valor en el input
    target.value = cleanedValue;
  }

  savePerfil() {
    if (this.isUpdating) {
      return;
    }

    // Validar formulario y mostrar errores específicos
    if (this.perfilForm.invalid) {
      this.mostrarErroresValidacion();
      return;
    }

    this.isUpdating = true;

    // Construir telefonos payload desde el FormArray
    const telefonosPayload = (this.perfilForm.value.telefonos || []).map(
      (t: any) => ({
        numeroTfno: this.limpiarNumeroTelefono(t.numeroTfno || ""),
        tipoTfno: t.tipoTfno || "",
        personaTfno: t.personaTfno || "Alumno",
        idTlfno: t.idTlfno || "",
      }),
    );

    // Construir apoderados payload desde el FormGroup (mantiene la estructura del backend)
    const apoderadoPayload = {
      nombre1Apo: this.perfilForm.value.apoderados?.nombre1Apo || "",
      nombre2Apo: this.perfilForm.value.apoderados?.nombre2Apo || "",
      apellidos1Apo: this.perfilForm.value.apoderados?.apellidos1Apo || "",
      apellidos2Apo: this.perfilForm.value.apoderados?.apellidos2Apo || "",
      tipo1Apo: this.perfilForm.value.apoderados?.tipo1Apo || "",
      tipo2Apo: this.perfilForm.value.apoderados?.tipo2Apo || "",
      email1Apo: this.perfilForm.value.apoderados?.email1Apo || "",
      email2Apo: this.perfilForm.value.apoderados?.email2Apo || "",
      tfno1Apo: this.limpiarNumeroTelefono(
        this.perfilForm.value.apoderados?.tfno1Apo || "",
      ),
      tfno2Apo: this.limpiarNumeroTelefono(
        this.perfilForm.value.apoderados?.tfno2Apo || "",
      ),
    };

    const updatedProfile = {
      ...this.perfilOriginal,
      ...this.perfilForm.value,
      telefonos: telefonosPayload,
      apoderado: apoderadoPayload,
      fechanac: this.perfilForm.value.fechanac || this.perfilOriginal?.fechanac,
      brazoDominante: this.perfilForm.value.brazoDominante,
      tipodoc: this.perfilForm.value.tipodoc,
      persona: this.perfilForm.value.persona,
      alergia: this.perfilForm.value.alergia,
      id_teams: this.perfilForm.value.id_teams,
      distrito: this.getSelectedDistrictName(),
      enteramiento: this.perfilForm.value.enteramiento,
      permiteLlamadas: this.perfilForm.value.permiteLlamadas,
      permiteCorreos: this.perfilForm.value.permiteCorreos,
      permiteWhatsapp: this.perfilForm.value.permiteWhatsapp,
    };

    // Obtener el código del alumno para la actualización
    const codigoAlumno = this.perfilOriginal?.codigo;
    if (!codigoAlumno) {
      this.snack.danger(
        "No se pudo obtener el código del alumno para actualizar",
      );
      return;
    }

    // Llamar al servicio para actualizar el perfil
    this.alumnoService.updateAlumno(codigoAlumno, updatedProfile).subscribe({
      next: (response) => {
        this.snack.success("Perfil actualizado correctamente");
        // Recargar el perfil para obtener los datos actualizados
        //this.cargarPerfil();
        this.isUpdating = false;
      },
      error: (error) => {
        console.error("Error al actualizar perfil:", error);
        this.snack.danger("Error al actualizar el perfil. Intenta nuevamente.");
        this.isUpdating = false;
      },
    });
  }

  abrirDialogTeams(): void {
    if (this.idteams) {
      this.dialog.open(TeamsDialogComponent, {
        width: "800px",
        maxWidth: "95vw",
        data: { idteams: this.idteams },
      });
    }
  }

  abrirDialogGmail(): void {
    this.dialog.open(GmailDialogComponent, {
      width: "600px",
    });
  }

  abrirDialogEvento(evento: any) {
    const dialogRef = this.dialog.open(EventoDialogComponent, {
      width: "600px",
      maxHeight: "80vh",
      disableClose: false,
      data: { evento: evento },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado === "asistencia_registrada") {
        // Aquí podrías actualizar la lista de eventos o mostrar un mensaje
        console.log("Asistencia registrada para el evento:", evento.titulo);
      }
    });
  }
}

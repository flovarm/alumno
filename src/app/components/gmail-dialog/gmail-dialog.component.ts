import { Component, Inject, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AlumnoService } from "../../services/alumno.service";
import { SnackService } from "../../services/snack.service";

@Component({
  selector: "app-gmail-dialog",
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon>alternate_email</mat-icon>
      Cuenta de Gmail
    </h2>

    <mat-dialog-content class="mat-dialog-content">
      <mat-card class="mb-4">
        <mat-card-content class="pt-4">
          <div class="grid grid-cols-1 gap-4">
            <div class="p-4 rounded-lg border border-blue-200">
              <div class="flex items-start gap-3 mb-3">
                <mat-icon class="text-[var(--mat-sys-primary)] mt-1"
                  >info</mat-icon
                >
                <div>
                  <p class="font-semibold text-[var(--mat-sys-primary)] mb-2">
                    Instrucciones para iniciar sesión en Gmail:
                  </p>
                  <ol
                    class="text-sm text-[var(--mat-sys-on-surface)] space-y-1 list-decimal list-inside"
                  >
                    <li>
                      Vaya a:
                      <a
                        href="https://mail.google.com/"
                        target="_blank"
                        class="text-blue-600 underline hover:text-blue-800"
                      >
                        https://mail.google.com/
                      </a>
                    </li>
                    <li>Ingrese su cuenta (email mostrado abajo)</li>
                    <li>Use la misma contraseña de Teams (se muestra abajo)</li>
                    <li class="text-[var(--mat-sys-error)] font-medium">
                      Si hay problemas, pruebe otro navegador o reinicie su PC
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <mat-icon class="text-[var(--mat-sys-primary)]">email</mat-icon>
              <div class="flex-1">
                <p class="font-medium text-[var(--mat-sys-on-surface)]">
                  Email:
                </p>
                <div class="flex items-center gap-2" style="flex-wrap: wrap;">
                  <p class="text-lg email-text">
                    {{ gmailEmail || "N/A" }}
                    <button
                      mat-icon-button
                      (click)="copiarTexto(gmailEmail)"
                      matTooltip="Copiar email"
                      class="copy-button"
                    >
                      <mat-icon>content_copy</mat-icon>
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <mat-icon class="text-[var(--mat-sys-primary)]">vpn_key</mat-icon>
              <div class="flex-1">
                <p class="font-medium text-[var(--mat-sys-on-surface)]">
                  Contraseña:
                </p>
                <div class="flex items-center gap-2">
                  <p class="text-lg font-mono">
                    {{ gmailPassword }}
                    <button
                      mat-icon-button
                      (click)="copiarTexto(gmailPassword)"
                      matTooltip="Copiar contraseña"
                      class="copy-button"
                    >
                      <mat-icon>content_copy</mat-icon>
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <a
        [href]="gmailUrl"
        target="_blank"
        rel="noopener noreferrer"
        mat-raised-button
        color="primary"
        class="gmail-button"
        [class.disabled]="!gmailEmail"
      >
        <mat-icon>open_in_new</mat-icon>
        Ir a mi Correo Institucional
      </a>
      <button mat-button [mat-dialog-close]="false">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .mat-dialog-content {
        max-height: 400px;
        overflow-y: auto;
      }

      .grid {
        display: grid;
      }

      .grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }

      .gap-4 {
        gap: 1rem;
      }

      .gap-2 {
        gap: 0.5rem;
      }

      .flex {
        display: flex;
      }

      .items-center {
        align-items: center;
      }

      .justify-center {
        justify-content: center;
      }

      .py-8 {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }

      .pt-4 {
        padding-top: 1rem;
      }

      .mb-4 {
        margin-bottom: 1rem;
      }

      .mb-2 {
        margin-bottom: 0.5rem;
      }

      .ml-4 {
        margin-left: 1rem;
      }

      .font-medium {
        font-weight: 500;
      }

      .font-mono {
        font-family:
          ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono",
          Menlo, monospace;
      }

      .text-lg {
        font-size: 1.125rem;
        line-height: 1.75rem;
      }

      .text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .text-6xl {
        font-size: 3.75rem;
        line-height: 1;
      }

      .text-center {
        text-align: center;
      }

      .flex-col {
        flex-direction: column;
      }

      .flex-1 {
        flex: 1 1 0%;
      }

      .copy-button {
        min-width: 36px !important;
        width: 36px !important;
        height: 36px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-left: 8px !important;
        vertical-align: middle !important;
      }

      .copy-button .mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        line-height: 1 !important;
      }

      /* Prevent long emails from overflowing on small screens */
      .email-text {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .bg-blue-50 {
        background-color: #eff6ff;
      }

      .border {
        border-width: 1px;
      }

      .border-blue-200 {
        border-color: #bfdbfe;
      }

      .rounded-lg {
        border-radius: 0.5rem;
      }

      .p-4 {
        padding: 1rem;
      }

      .space-y-1 > * + * {
        margin-top: 0.25rem;
      }

      .list-decimal {
        list-style-type: decimal;
      }

      .list-inside {
        list-style-position: inside;
      }

      .text-blue-600 {
        color: #2563eb;
      }

      .text-blue-700 {
        color: #1d4ed8;
      }

      .text-blue-800 {
        color: #1e40af;
      }

      .text-orange-700 {
        color: #c2410c;
      }

      .font-semibold {
        font-weight: 600;
      }

      .underline {
        text-decoration-line: underline;
      }

      .hover\:text-blue-800:hover {
        color: #1e40af;
      }

      a {
        transition: color 0.2s;
      }

      .gmail-button {
        container-color: var(--mat-sys-secondary);
        color: var(--mat-sys-secondary);
      }
    `,
  ],
})
export class GmailDialogComponent implements OnInit {
  private alumnoService = inject(AlumnoService);
  private snack = inject(SnackService);
  user = JSON.parse(localStorage.getItem("alumno_currentUser") || "{}");
  teamsData: any = null;
  errorMessage: string = "";

  constructor(public dialogRef: MatDialogRef<GmailDialogComponent>) {}

  ngOnInit(): void {}

  get gmailEmail(): string {
    // Reutiliza el email de Teams cambiando el dominio a elcultural.edu.pe
    return `${this.user.userName}@elcultural.edu.pe`;
  }

  get gmailPassword(): string {
    // Mismo esquema de contraseña: Cultural + primeros 4 caracteres de userName
    return `Cultural${this.user.userName?.substring(0, 4) || ""}`;
  }

  get gmailUrl(): string {
    const email = this.gmailEmail;
    if (!email) {
      return "#";
    }
    return (
      "https://mail.google.com/mail/u/?authuser=" + encodeURIComponent(email)
    );
  }

  copiarTexto(texto: string): void {
    if (!texto || texto === "N/A") {
      this.snack.warning("No hay texto para copiar");
      return;
    }

    navigator.clipboard
      .writeText(texto)
      .then(() => {
        this.snack.success("Texto copiado al portapapeles");
      })
      .catch(() => {
        // Fallback para navegadores más antiguos
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        this.snack.success("Texto copiado al portapapeles");
      });
  }
}

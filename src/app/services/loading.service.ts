import { Injectable } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";

@Injectable({ providedIn: "root" })
export class PaymentSpinnerService {
  private activeSpinners = new Set<string>();

  constructor(private spinner: NgxSpinnerService) {}

  showPaymentSpinner(message: string = "Procesando pago...") {
    const spinnerId = "payment-spinner";
    this.activeSpinners.add(spinnerId);

    this.spinner.show(spinnerId, {
      bdColor: "rgba(0, 0, 0, 0.8)",
      size: "large",
      color: "#fff",
      type: "ball-scale-multiple",
      fullScreen: true,
      template: `
        <div class="payment-spinner-container">
          <div class="payment-spinner-content">
            <div class="spinner-icon">💳</div>
            <p class="spinner-text">${message}</p>
            <div class="spinner-subtext">Por favor no cierres esta ventana</div>
          </div>
        </div>
      `,
    });
  }

  showMatriculationSpinner(message: string = "Procesando matrícula...") {
    const spinnerId = "matriculation-spinner";
    this.activeSpinners.add(spinnerId);

    this.spinner.show(spinnerId, {
      bdColor: "rgba(0, 0, 0, 0.8)",
      size: "large",
      color: "#fff",
      type: "ball-scale-multiple",
      fullScreen: true,
      template: `
        <div class="payment-spinner-container">
          <div class="payment-spinner-content">
            <div class="spinner-icon">📚</div>
            <p class="spinner-text">${message}</p>
            <div class="spinner-subtext">Generando tu boleta...</div>
          </div>
        </div>
      `,
    });
  }

  showBookPurchaseSpinner(message: string = "Procesando compra de libros...") {
    const spinnerId = "book-spinner";
    this.activeSpinners.add(spinnerId);

    this.spinner.show(spinnerId, {
      bdColor: "rgba(0, 0, 0, 0.8)",
      size: "large",
      color: "#fff",
      type: "ball-scale-multiple",
      fullScreen: true,
      template: `
        <div class="payment-spinner-container">
          <div class="payment-spinner-content">
            <div class="spinner-icon">📖</div>
            <p class="spinner-text">${message}</p>
            <div class="spinner-subtext">Procesando tu pedido...</div>
          </div>
        </div>
      `,
    });
  }

  hidePaymentSpinner() {
    const spinnerId = "payment-spinner";
    if (this.activeSpinners.has(spinnerId)) {
      this.spinner.hide(spinnerId);
      this.activeSpinners.delete(spinnerId);
    }
  }

  hideMatriculationSpinner() {
    const spinnerId = "matriculation-spinner";
    if (this.activeSpinners.has(spinnerId)) {
      this.spinner.hide(spinnerId);
      this.activeSpinners.delete(spinnerId);
    }
  }

  hideBookPurchaseSpinner() {
    const spinnerId = "book-spinner";
    if (this.activeSpinners.has(spinnerId)) {
      this.spinner.hide(spinnerId);
      this.activeSpinners.delete(spinnerId);
    }
  }

  hideAllSpinners() {
    this.activeSpinners.forEach((spinnerId) => {
      this.spinner.hide(spinnerId);
    });
    this.activeSpinners.clear();
  }

  isSpinnerActive(type: "payment" | "matriculation" | "book"): boolean {
    const spinnerIds = {
      payment: "payment-spinner",
      matriculation: "matriculation-spinner",
      book: "book-spinner",
    };

    return this.activeSpinners.has(spinnerIds[type]);
  }
}

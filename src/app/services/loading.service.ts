import { Injectable } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";

@Injectable({ providedIn: "root" })
export class PaymentSpinnerService {
  private isActive = false;
  private readonly spinnerId = "universal-spinner";

  constructor(private spinner: NgxSpinnerService) {}

  showSpinner(message: string = "Procesando...") {
    this.isActive = true;

    this.spinner.show(this.spinnerId, {
      bdColor: "rgba(0, 0, 0, 0.8)",
      size: "large",
      color: "#fff",
      type: "ball-scale-multiple",
      fullScreen: true,
    });
  }

  hideSpinner() {
    if (this.isActive) {
      this.spinner.hide(this.spinnerId);
      this.isActive = false;
    }
  }

  isSpinnerActive(): boolean {
    return this.isActive;
  }
}

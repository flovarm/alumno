import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { NgxSpinnerComponent } from "ngx-spinner";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, MatSidenavModule, NgxSpinnerComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "Alumno";
}

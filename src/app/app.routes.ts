import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";
import { loginGuard } from "./guards/login.guard";
import { perfilCompletoGuard } from "./guards/perfil-completo.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./layouts/main-layout/main-layout.component").then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: "home",
        loadComponent: () =>
          import("./pages/home/home.component").then((m) => m.HomeComponent),
      },
      {
        path: "historial-academico",
        loadComponent: () =>
          import("./pages/historial-academico/historial-academico.component").then(
            (m) => m.HistorialAcademicoComponent,
          ),
      },
      {
        path: "historial-pagos",
        loadComponent: () =>
          import("./pages/historial-pagos/historial-pagos.component").then(
            (m) => m.HistorialPagosComponent,
          ),
      },
      {
        path: "registro-matricula",
        loadComponent: () =>
          import("./pages/registro-matricula/registro-matricula.component").then(
            (m) => m.RegistroMatriculaComponent,
          ),
        //   canActivate: [perfilCompletoGuard],
      },
      {
        path: "pago-exitoso",
        loadComponent: () =>
          import("./pages/pago-exitoso/pago-exitoso.component").then(
            (m) => m.PagoExitosoComponent,
          ),
      },
      {
        path: "boleta-electronica",
        loadComponent: () =>
          import("./pages/boleta-electronica/boleta-electronica.component").then(
            (m) => m.BoletaElectronicaComponent,
          ),
      },
      {
        path: "boleta-electronica/:documentoId",
        loadComponent: () =>
          import("./pages/boleta-electronica/boleta-electronica.component").then(
            (m) => m.BoletaElectronicaComponent,
          ),
      },
      {
        path: "compra-libros",
        loadComponent: () =>
          import("./pages/compra-libros/compra-libros.component").then(
            (m) => m.CompraLibrosComponent,
          ),
      },
      {
        path: "resumen-compra-libro",
        loadComponent: () =>
          import("./pages/resumen-compra-libro/resumen-compra-libro.component").then(
            (m) => m.ResumenCompraLibroComponent,
          ),
      },
      {
        path: "pago-deuda",
        loadComponent: () =>
          import("./pages/deuda/deuda.component").then((m) => m.DeudaComponent),
      },
      {
        path: "",
        redirectTo: "home",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "login",
    loadComponent: () =>
      import("./components/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "/home",
  },
];

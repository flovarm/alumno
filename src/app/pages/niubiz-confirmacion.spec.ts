import { DeudaComponent } from './deuda/deuda.component';
import { CompraLibrosComponent } from './compra-libros/compra-libros.component';
import { RegistroMatriculaComponent } from './registro-matricula/registro-matricula.component';

describe('Confirmacion de pago Niubiz', () => {
  let previousSdk: any;
  let configuration: any;
  let button: HTMLButtonElement;
  let submittedForms: HTMLFormElement[];
  let submit: jasmine.Spy;
  let savedPurchaseNumber: string | null;

  beforeEach(() => {
    previousSdk = (window as any).VisanetCheckout;
    savedPurchaseNumber = sessionStorage.getItem('niubiz_purchase_number');
    (window as any).VisanetCheckout = {
      configure: (value: any) => configuration = value,
      open: jasmine.createSpy('open'),
    };
    button = document.createElement('button');
    button.id = 'niubizPayButton';
    document.body.appendChild(button);
    submittedForms = [];
    submit = spyOn(HTMLFormElement.prototype, 'submit').and.callFake(function(this: HTMLFormElement) {
      submittedForms.push(this);
    });
  });

  afterEach(() => {
    (window as any).VisanetCheckout = previousSdk;
    button.remove();
    submittedForms.forEach(form => form.remove());
    if (savedPurchaseNumber === null) sessionStorage.removeItem('niubiz_purchase_number');
    else sessionStorage.setItem('niubiz_purchase_number', savedPurchaseNumber);
  });

  for (const componentType of [DeudaComponent, CompraLibrosComponent, RegistroMatriculaComponent]) {
    it(`${componentType.name}: no abre el pago sin aceptar los términos`, () => {
      const component: any = Object.create(componentType.prototype);
      component.terminosAceptados = false;
      component.abrirPagoNiubiz(120);
      expect((window as any).VisanetCheckout.open).not.toHaveBeenCalled();
    });

    it(`${componentType.name}: bloquea, actualiza la vista y envia una sola vez`, () => {
      // Aislar el callback del SDK sin cargar datos ni invocar servicios de pago.
      const component: any = Object.create(componentType.prototype);
      Object.assign(component, {
        sessionKeyActual: 'test-session', montoActual: '120.00', orderNumberActual: 'test-order',
        resumen: { idHorario: 1 }, user: { codigo: 'test', userName: 'test' },
        matriculaDataActual: { IdHorario: 1, docid: 'test', channel: 'web' },
        pagoEnviado: false, procesandoPago: false, terminosAceptados: true,
        changeDetector: { detectChanges: jasmine.createSpy('detectChanges') },
      });
      component.abrirPagoNiubiz(120);
      expect(component.procesandoPago).toBeFalse();
      configuration.complete({ transactionToken: 'test-token' });
      expect(component.procesandoPago).toBeTrue();
      expect(component.changeDetector.detectChanges).toHaveBeenCalledTimes(1);
      expect(submit).toHaveBeenCalledTimes(1);
      expect(submittedForms[0].querySelector<HTMLInputElement>('[name="order.tokenId"]')?.value).toBe('test-token');
      if (componentType === RegistroMatriculaComponent) {
        expect(button.disabled).toBeTrue();
        expect(button.textContent).toBe('Procesando pago...');
        expect(button.getAttribute('aria-busy')).toBe('true');
      }
      configuration.complete({ transactionToken: 'test-token' });
      component.abrirPagoNiubiz(120);
      expect(submit).toHaveBeenCalledTimes(1);
      expect((window as any).VisanetCheckout.open).toHaveBeenCalledTimes(1);
    });
  }

  it('Matrícula: habilita y vuelve a deshabilitar el botón al cambiar la aceptación', () => {
    const component: any = Object.create(RegistroMatriculaComponent.prototype);
    component.actualizarAceptacionTerminos(true);
    expect(button.disabled).toBeFalse();
    component.actualizarAceptacionTerminos(false);
    expect(button.disabled).toBeTrue();
  });
});

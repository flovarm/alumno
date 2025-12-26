export const environment = {
  production: true,
  simulatePayment: false, // Usar pago real en producción
   apiUrl: 'https://elcultural.edu.pe/intranet2/api/',
  izipay: {
    scriptUrl: 'https://checkout.izipay.pe/payments/v1/js/index.js', // URL de producción
    merchantCode: '4079961'
  }
};

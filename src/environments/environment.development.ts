export const environment = {
        //  production: false,
        //  simulatePayment: false, // Simular pago en desarrollo
        //  apiUrl: 'https://localhost:5001/api/',
        //  izipay: {
        //      scriptUrl: 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js',
        //      merchantCode: '4004353'
        // }
          production: true,
        simulatePayment: false, // Usar pago real en producción
         apiUrl: 'https://elcultural.edu.pe/intranet/api/',
       // apiUrl: 'https://localhost:5001/api/',
        izipay: {
          scriptUrl: 'https://checkout.izipay.pe/payments/v1/js/index.js', // URL de producción
          merchantCode: '4079961'
      }
};
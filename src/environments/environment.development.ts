export const environment = {
   production: false,
   apiUrl: '/api/',
   webhookUrl: '/api/',
   izipay: {
     scriptUrl: 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js',
     merchantCode: '4004353',
     ipnUrl: '/api/registro/webhook/izipay',
   },
//   production: true,
//   apiUrl: 'https://elcultural.edu.pe/intranet2/api/',
//   webhookUrl: 'https://elcultural.edu.pe/intranet2/api/',
//   izipay: {
//     scriptUrl: 'https://checkout.izipay.pe/payments/v1/js/index.js', // URL de producción
//     merchantCode: '4079961',
//   },
};

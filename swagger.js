const swaggerAutogen = require('swagger-autogen');

const doc = {
  info: {
    title: 'NoSQL APP',
    description: 'by Yurii Romanov'
  },
};

const outputFile = './swagger.json';
const routes = ['./index.js'];

swaggerAutogen(outputFile, routes, doc);
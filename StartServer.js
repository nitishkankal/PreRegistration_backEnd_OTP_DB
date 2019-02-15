const http = require('http');
const  app = require('./app_send_varify');


const port = process.env.port || 8000;

const server = http.createServer(app);

server.listen(port);
console.log("Express Started on Port "+port);
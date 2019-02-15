var mysql = require('mysql');

var connection = mysql.createConnection({
  host: "203.151.51.61",
  user: "nitish",
  password: "nickp@ss",
  database : 'TheRegisterApp',
});


module.exports = connection;
 
 
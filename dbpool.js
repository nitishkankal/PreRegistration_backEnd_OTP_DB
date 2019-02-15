const util = require('util')
const mysql = require('mysql')


var pool = mysql.createPool({
    connectionLimit: 10,    //for production 100
    host: "203.151.51.61",
    user: "nitish",
    password: "nickp@ss",
    database : 'TheRegisterApp',
    debug    :  false
})
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }

    if (connection) connection.release()

    return
})

 
// Promisify for Node.js async/await.
//pool.query = util.promisify(pool.query)
 

module.exports = pool
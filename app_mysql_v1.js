'use strict';
var Express = require("express");
var BodyParser = require("body-parser");
const ejs = require('ejs');
const nodemailer = require('nodemailer');
var app = Express();
var cors = require('cors');
var connection = require('./dbConnect');
//var pool = require('./dbpool')



/* app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  }); */
app.use(cors());
/* app.options('*', cors())  */
// EJS
app.set('view engine', 'ejs');

app.use(Express.static('public'));
app.use(BodyParser.urlencoded({ extended: true }));

 

app.get('/', (req, res) => res.render('index'));

  function getConnection() {
    if (connection.state === 'disconnected') {
        //return respond(null, { status: 'fail', message: 'server down'});
        connection.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
        });
    }

}  
 

app.get("/getdb",   function (request, response) {

      connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    }); 

    let sql = `CALL getCustomerPreRegister(?)`;
   
    connection.connect(function(err) {
        if (err) {
            console.error('Error connecting: ' + err.stack);
            return;
        }
    
        console.log('Connected as id ' + connection.threadId);
    });
    
    connection.query(sql, [2], function (error, results, fields) {
        if (error)
            throw error;
    
        results.forEach(result => {
            console.log(result);
        });
    });
    
    connection.end();

   /*  connection.query(sql, [2], function (error, results, fields) {
        if (error)
            throw error;

        results.forEach(result => {
            console.log(result);
        });
    }); */

   //

});

app.post("/sendmail", async  function (request, response) {



    // Extract the query-parameter
    console.log("email request recived");
    console.log(request.body);
    var email = request.body.email;
    var emailStatusPromise = sendEmail(email);
    emailStatusPromise.then(function (result) {


        getConnection();

        let sql = `CALL insCustomerPreRegister1(?)`;
        //paramerter iEmail,iUser,iPass,iSource,iContac

        connection.query(sql, [email], function (error, results, fields) {
            if (error) {
                console.log(error.message);
                if (error.code == 'ER_DUP_ENTRY' || error.errno == 1062) {
                    console.log('Here you can handle duplication');
                    response.json({
                        'Status': 'You have already subscribed with this email, please try another email. '
                
                    });
                }
                else {
                    console.log('Other error in the query')
                }

            }
            else{
                response.json({
                    'Email': 'An Email has been sent with activation link to your Email Address, </br> Please clink link activate '
            
                });
            }

            console.log(results);

        });

        connection.end();

    }, function (err) {
        console.log(err);
    })


    

});

function sendEmail(emailaddress) {
    console.log(emailaddress);
    return new Promise((resolve, reject) => {


        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer.createTestAccount((err, account) => {
            // create reusable transporter object using the default SMTP transport
            /* let transporter = nodemailer.createTransport({
                host: 'cloud-mail-mx2.thaidatahosting.com',
                port: 25,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: "dev.contact@traceon.co.th", // generated ethereal user
                    pass: "Abc1234!" // generated ethereal password
                }
            }); */
            let transporter = nodemailer.createTransport(
                {
                    host: 'cloud-mail-mx2.thaidatahosting.com',
                    port: 25,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: "dev.contact@traceon.co.th", // generated ethereal user
                        pass: "Abc1234!" // generated ethereal password
                    },
                    logger: false,
                    debug: false // include SMTP traffic in the logs
                },
                {
                    // default message fields

                    // sender info
                    from: 'Traceon <no-reply@traceon.co.th>',
                    headers: {
                        'X-Laziness-level': 0 // just an example header, no need to use this
                    }
                }
            );

            /*    // setup email data with unicode symbols
               let mailOptions = {
                   from: '"Nitsh Foo 👻" <dev.contact@traceon.co.th>', // sender address
                   to: '"P KI"   <'+emailaddress+'>', // list of receivers
                   subject: 'Hello ✔', // Subject line
                   text: 'Hello world?', // plain text body
                   html: '<b>Hello world?</b>' // html body
               }; */
            // Message object
            let message = {
                // Comma separated list of recipients
                to: '"P KI"   <' + emailaddress + '>',

                // Subject of the message
                subject: 'Nodemailer is unicode friendly ✔',

                // plaintext body
                text: 'Hello to myself!',

                // HTML body
                html:
                    '<table style="height: 100px; border-color: #2196f3;" width="100%" bgcolor="">' +
                    '<tbody>' +
                    '<tr>' +
                    '<td style="width: 93%;" colspan="3"><hr /></td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td style="width: 93%;" colspan="3">' +
                    '<p> </p>' +
                    '<p><img style="display: block; margin-left: auto; margin-right: auto;" src="http://203.151.51.169/prereg3/img/Logo-dev-for-white-bg.png" alt="" width="139" height="139" /></p>' +
                    '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td style="width: 93%;" colspan="3">   <hr /></td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td style="width: 34.471%;">' +
                    '<h4> Dear Value Customer,</h4>' +
                    '</td>' +
                    '<td style="width: 35.529%;"> </td>' +
                    '<td style="width: 23%;"> </td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td style="width: 93%;" colspan="3">' +
                    '<p>           Thank you very much for your pre registration. with this email <email@t.c> Any rewards will send to you soon.</p>' +
                    '<p> </p>' +
                    '<p>Trace on Development. Co., Ltd.</p>' +
                    '<hr /></td>' +
                    '</tr>' +
                    '</tbody>' +
                    '</table>' +
                    '<p style="text-align: left;"> </p>' +
                    '<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="https://rukminim1.flixcart.com/image/800/960/jn4x47k0/t-shirt/x/4/w/s-g10001hp-superdry-original-imaf9ntrvwrbvpvt.jpeg?q=50"/></p>',

                // An array of attachments
                attachments: [
                    // String attachment
                    {
                        filename: 'notes.txt',
                        content: 'Some notes about this e-mail',
                        contentType: 'text/plain' // optional, would be detected from the filename
                    },

                    // Binary Buffer attachment
                    {
                        filename: 'add_blue.png',
                        content: Buffer.from(
                            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
                            '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
                            'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC',
                            'base64'
                        ),

                        cid: 'note@example.com' // should be as unique as possible
                    },

                    // File Stream attachment
                    {
                        filename: 'add_blue.png',
                        path: __dirname + '/add_blue.png',
                        cid: 'nyan@example.com' // should be as unique as possible
                    }
                ],

                list: {
                    // List-Help: <mailto:admin@example.com?subject=help>
                    help: 'admin@example.com?subject=help',

                    // List-Unsubscribe: <http://example.com> (Comment)
                    unsubscribe: [
                        {
                            url: 'http://example.com/unsubscribe',
                            comment: 'A short note about this url'
                        },
                        'unsubscribe@example.com'
                    ],

                    // List-ID: "comment" <example.com>
                    id: {
                        url: 'mylist.example.com',
                        comment: 'This is my awesome list'
                    }
                }
            };
            // send mail with defined transport object
            transporter.sendMail(message, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(false)
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                resolve(true);
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });
    })
}

module.exports = app;
var express = require('express');
var bodyParser = require('body-parser');
var nodemailer = require("nodemailer");
//var redis = require('redis');
//var redisClient = redis.createClient(6789, "203.151.51.60"); // default setting. TraceoNRediS
// var mandrillTransport = require('nodemailer-mandrill-transport');
var async = require('async');
var app = express();
var pool = require('./dbpool')
var cors = require('cors');
var Mailgen = require('mailgen');
var path = require('path');
app.use(cors());
/* app.options('*', cors())  */
// EJS
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));




/*
	* Here we are configuring our SMTP Server details.
	* STMP is mail server which is responsible for sending and recieving email.
  * We are using Mandrill here.
*/

var smtpTransport = nodemailer.createTransport(
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

/*------------------SMTP Over-----------------------------*/


/*------------------Mailgen email Configure  -----------------------------*/

// Configure mailgen by setting a theme and your product info
var mailGenerator = new Mailgen({
    //theme: 'cerberus',
    theme: {
        // Build an absolute path to the theme file within your project
        path: path.resolve('assets/mailgen/Email.html'),
        // Also (optionally) provide the path to a plaintext version of the theme (if you wish to use `generatePlaintext()`)
        plaintextPath: path.resolve('assets/mailgen/Email.txt')
    },
    product: {
        // Appears in header & footer of e-mails
        name: 'OneAPP',
        link: 'www.traceon.co.th',
        // Optional logo
        logo: 'http://www.traceon.co.th/uploads/config/20150723/adilruxy0457.png'
    }
});


/*------------------Mailgen email Configure  done-----------------------------*/








/*------------------Routing Started ------------------------*/
var web_host = "192.168.13.65:8000";
console.log(web_host);

app.use(bodyParser.urlencoded({ "extended": false }));




app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


/*********************************************************************************************  */
/***********************************************SELLER*************************************  */
/*********************************************************************************************  */



app.post('/sendPrivateRegSeller', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    console.log("fullUrl" + fullUrl);

    //`FullName`,`BusinessName`,`BusinessWebSite`,`Email`,`MobileNumber`,`FacebookID`,`LineID`,`packageID`)  =8
    //(customCheck1`,`customCheck2`,`customCheck3`,`customCheck4`,`customCheck5`,`customCheck6`,`customCheck7`,customCheck8,customCheck9,customCheck10`,`customCheckOther`,customCheckWish` )  =12
    var FullName = req.body.FullName;
    var BusinessName = req.body.BusinessName;
    var BusinessWebSite = req.body.BusinessWebSite;
    var Email = req.body.Email;
    var MobileNumber = req.body.MobileNumber;
    var FacebookID = req.body.FacebookID;
    var LineID = req.body.LineID;
    var packageID = req.body.packageID;


    var customCheck1 = req.body.customCheck1 ? 1 : 0;
    var customCheck2 = req.body.customCheck2 ? 1 : 0;
    var customCheck3 = req.body.customCheck3 ? 1 : 0;
    var customCheck4 = req.body.customCheck4 ? 1 : 0;
    var customCheck5 = req.body.customCheck5 ? 1 : 0;
    var customCheck6 = req.body.customCheck6 ? 1 : 0;
    var customCheck7 = req.body.customCheck7 ? 1 : 0;
    var customCheck8 = 0;
    var customCheck9 = 0;
    var customCheck10 = 0;
    var customCheckOther = req.body.customCheckOther;
    var customCheckWish = req.body.customCheckWish;

    console.log(FullName + BusinessName + BusinessWebSite + Email + MobileNumber + FacebookID + LineID + packageID);
    console.log(customCheck1 + "   " + customCheck2 + "   " + customCheck3 + "   " + customCheck3 + "   " + customCheck4);

    /*------------------Mailgen email format  -----------------------------*/

    // Prepare email contents
    var email = {
        body: {
            name: FullName,
            intro: 'Thank you for registering with us. \n Your have provided below details ',
            table: {
                data: [
                    {
                        UserField: 'Email',
                        details: Email,
                    },
                    {
                        UserField: 'BusinessName',
                        details: BusinessName,
                    },
                    {
                        UserField: 'BusinessWebSite',
                        details: BusinessWebSite,
                    },
                    {
                        UserField: 'MobileNumber',
                        details: MobileNumber,
                    },
                    {
                        UserField: 'FacebookID',
                        details: FacebookID,
                    },
                    {
                        UserField: 'LineID',
                        details: LineID,
                    },

                ],
                columns: {
                    // Optionally, customize the column widths
                    customWidth: {
                        UserField: '40%',
                        details: '60%'
                    },
                    // Optionally, change column text alignment
                    customAlignment: {
                        details: 'right'
                    }
                }
            },
            action: {
                instructions: 'You can check the status of your special package promotion and more details in your dashboard:',
                button: {
                    color: '#19b9e7;',
                    text: 'Welcome to Future',
                    link: 'http://192.168.13.65:81/preRegister_private/welcome.html'
                }
            },
            outro: ' Your life just become Simpler!!! .'
        }
    };
    // Generate an HTML email with the provided contents
    var emailBody = mailGenerator.generate(email);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    var emailText = mailGenerator.generatePlaintext(email);

    // Optionally, preview the generated HTML e-mail by writing it to a local file
    require('fs').writeFileSync('preview.html', emailBody, 'utf8');
    require('fs').writeFileSync('preview.txt', emailText, 'utf8');

    /*------------------Mailgen email format over  -----------------------------*/





    async.waterfall([
        function (callback) {
            callback(null);
            /* let sql = `CALL getPrivateSellerPreRegister(?)`;

            pool.query(sql, [Email], function (err, result) {
                if (err) {
                    return callback(true, "Error in Mysql");
                }
                if (result && result[0].length) {
                    return callback(true, "Email already Registed to Oneapp");
                }
                callback(null);
            }); */
        },
        function (callback) {
            //key is email and value is redisdata


            let sql = `CALL insPrivateRegisSurvey(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            //FullName,BusinessName,BusinessWebSite,Email,MobileNumber,FacebookID,LineID,packageID)  =8
            //(customCheck1,customCheck2,customCheck3,customCheck4,customCheck5,customCheck6,customCheck7,customCheck8,customCheck9,customCheck10,customCheckOther,customCheckWish )  =12

            pool.query(sql, [FullName, BusinessName, BusinessWebSite, Email, MobileNumber, FacebookID, LineID, packageID, customCheck1, customCheck2, customCheck3, customCheck4, customCheck5, customCheck6, customCheck7, customCheck8, customCheck9, customCheck10, customCheckOther, customCheckWish], function (error, results, fields) {
                if (error) {
                    console.log(error.message);
                    if (error.code == 'ER_DUP_ENTRY' || error.errno == 1062) {
                        console.log('Here you can handle duplication');
                        return callback(true, "Please try again! Not registered to database");
                    }
                    else {
                        console.log('Other error in the query');
                        return callback(true, "Please try again! Not registered to database");
                    }

                }
                else {
                    //added to db
                    console.log("Registration Successful..................");

                    let rand = Math.floor((Math.random() * 100) + 54);
                    let encodedMail = new Buffer.from(Email).toString('base64');
                    let link = "http://" + req.get('host') + "/verifySeller?mail=" + encodedMail + "&id=" + rand;
                    let mailOptions = {
                        from: '"Nick 👻" <dev.contact@traceon.co.th>', // sender address
                        to: Email,
                        subject: "Please confirm your Email account",
                    //   html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>" 
                         html: emailBody,
                         text: emailText,
                    };

                    //console.log(mailOptions);
                    smtpTransport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                            return callback(true, "Error in sending email");
                        }
                        console.log("Message sent: " + JSON.stringify(response));
                        callback(null, "Email sent Successfully");
                    });
                }

                console.log(results);

            });
        },


    ], function (err, data) {
        console.log(err, data);
        res.json({ error: err === null ? false : true, data: data });
    });
});


/* app.get('/verifySeller', function (req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    //if((req.protocol+"://"+req.get('host')) === ("http://"+web_host)) {
    //	console.log("Domain is matched. Information is from Authentic email");
    async.waterfall([
        function (callback) {
            let decodedMail = new Buffer.from(req.query.mail, 'base64').toString('ascii');
            redisClient.get(decodedMail, function (err, reply) {
                if (err) {
                    return callback(true, "Error in redis");
                }
                if (reply === null) {
                    return callback(true, "Invalid email address");
                }
                callback(null, decodedMail, reply);  //this is callbackk to next waterfall fucntion

            });
        },
        function (key, redisData, callback) {
            //key is email and value is redisdata
            if (redisData === req.query.id) {
                redisClient.del(key, function (err, reply) {
                    if (err) {
                        return callback(true, "Error in redis");
                    }
                    if (reply !== 1) {
                        return callback(true, "Issue in redis");
                    }
                    callback(null, key);
                });

                //add to mysql db

            } else {
                return callback(true, "Invalid_token");
            }
        },
        function (email, callback) {
            //key is email and value is redisdata


            let sql = `CALL insSellerPreRegister1(?)`;
            //paramerter iEmail,iUser,iPass,iSource,iContac

            pool.query(sql, [email], function (error, results, fields) {
                if (error) {
                    console.log(error.message);
                    if (error.code == 'ER_DUP_ENTRY' || error.errno == 1062) {
                        console.log('Here you can handle duplication');
                        return callback(true, "Please try again! Not registered to database");
                    }
                    else {
                        console.log('Other error in the query');
                        return callback(true, "Please try again! Not registered to database");
                    }

                }
                else {
                    //added to db
                    console.log("Registration Successful..................");
                    callback(null, "Registration Successful");
                }

                console.log(results);

            });
        }

    ], function (err, data) {
        res.send(data);
    });
    
}); */


/*--------------------Routing Over----------------------------*/

/* app.listen(3000,function(){
	console.log("Express Started on Port 3000");
}); */

module.exports = app;
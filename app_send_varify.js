var express = require('express');
var bodyParser = require('body-parser');
var nodemailer = require("nodemailer");
var redis = require('redis');
var redisClient = redis.createClient(6789, "203.151.51.60"); // default setting. TraceoNRediS
// var mandrillTransport = require('nodemailer-mandrill-transport');
var async = require('async');
var app = express();
var pool = require('./dbpool')
var cors = require('cors');


app.use(cors());
/* app.options('*', cors())  */
// EJS
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


redisClient.auth("TraceoNRediS");
redisClient.on('connect', function () {
    console.log('Redis client connected');
});

redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});
redisClient.select(4);

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

/*------------------Routing Started ------------------------*/
var web_host = "localhost:8000";
console.log(web_host);

app.use(bodyParser.urlencoded({ "extended": false }));




app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


/*********************************************************************************************  */
/***********************************************SELLER*************************************  */
/*********************************************************************************************  */

function insertSocialData(emailid, appname, appid) {
    return new Promise((resolve, reject) => {
        let sql = `CALL insSellerLinkedAccount(?,?,?)`;

        console.log(emailid + "\t" + appname + "\t" + appid);

        pool.query(sql, [emailid, appname, appid], function (err, result) {
            if (err) {
                console.log(error.message);
                if (error.code == 'ER_DUP_ENTRY' || error.errno == 1062) {
                    console.log('Here you can handle duplication');
                }
                else {
                    console.log('Other error in the query');
                }
                reject(error);
            }
            else {
                //added to db
                console.log("Social add  Successful..................");
                resolve(appname + " ID  = " + appid + " is updated");
            }

        });

    })
}
app.post('/sendSocial', function (req, res) {

    var emailid = req.body.emailid;

    var facebook = req.body.facebook;
    var line = req.body.line;
    var youtube = req.body.youtube;

    var appfb = 'facebook';
    var appline = 'line';
    var appyoutube = 'youtube';

    console.log(facebook + "\t" + line + "\t" + youtube);

    Promise.all([insertSocialData(emailid, appfb, facebook), insertSocialData(emailid, appline, line), insertSocialData(emailid, appyoutube, youtube)])
        .then(arrayOfResults => {
            // Do something with all results
            console.log(arrayOfResults);
            res.json(arrayOfResults);
        }).catch(function (e) {
            console.log(e);
        });


});

app.post('/sendSeller', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    console.log("fullUrl" + fullUrl);
    console.log(req.body.email);
    var inputEmail = req.body.email;
    async.waterfall([
        function (callback) {

            let sql = `CALL getSellerPreRegister(?)`;

            pool.query(sql, [inputEmail], function (err, result) {
                if (err) {
                    return callback(true, "Error in Mysql");
                }
                if (result && result[0].length) {
                    return callback(true, "Email already Registed to Oneapp");
                }
                callback(null);
            });
        },
        function (callback) {
            redisClient.exists(req.body.email, function (err, reply) {
                if (err) {
                    return callback(true, "Error in redis");
                }
                if (reply === 1) {
                    return callback(true, "Email already requested");
                }
                callback(null);
            });
        },
        function (callback) {
            let rand = Math.floor((Math.random() * 100) + 54);
            let encodedMail = new Buffer.from(req.body.email).toString('base64');
            let link = "http://" + req.get('host') + "/verifySeller?mail=" + encodedMail + "&id=" + rand;
            let mailOptions = {
                from: '"Nick 👻" <dev.contact@traceon.co.th>', // sender address
                to: req.body.email,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
            };
            callback(null, mailOptions, rand);
        },
        function (mailData, secretKey, callback) {
            console.log(mailData);
            smtpTransport.sendMail(mailData, function (error, response) {
                if (error) {
                    console.log(error);
                    return callback(true, "Error in sending email");
                }
                console.log("Message sent: " + JSON.stringify(response));
                redisClient.set(req.body.email, secretKey);
                redisClient.expire(req.body.email, 900); // expiry for 10 minutes.
                callback(null, "Email sent Successfully");
            });
        }
    ], function (err, data) {
        console.log(err, data);
        res.json({ error: err === null ? false : true, data: data });
    });
});


app.get('/verifySeller', function (req, res) {
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
    /*  } else {
           res.end("<h1>Request is from unknown source");
     } */
});

/*********************************************************************************************  */
/***********************************************CUSTOMER*************************************  */
/*********************************************************************************************  */
app.post('/send', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    console.log("fullUrl" + fullUrl);
    console.log(req.body.email);
    var inputEmail = req.body.email;
    async.waterfall([
        function (callback) {

            let sql = `CALL getCustomerPreRegister(?)`;

            pool.query(sql, [inputEmail], function (err, result) {
                if (err) {
                    return callback(true, "Error in Mysql");
                }
                if (result && result[0].length) {
                    return callback(true, "Email already Registed to Oneapp");
                }
                callback(null);
            });
        },
        function (callback) {
            redisClient.exists(req.body.email, function (err, reply) {
                if (err) {
                    return callback(true, "Error in redis");
                }
                if (reply === 1) {
                    return callback(true, "Email already requested");
                }
                callback(null);
            });
        },
        function (callback) {
            let rand = Math.floor((Math.random() * 100) + 54);
            let encodedMail = new Buffer.from(req.body.email).toString('base64');
            let link = "http://" + req.get('host') + "/verify?mail=" + encodedMail + "&id=" + rand;
            let mailOptions = {
                from: '"Nick 👻" <dev.contact@traceon.co.th>', // sender address
                to: req.body.email,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
            };
            callback(null, mailOptions, rand);
        },
        function (mailData, secretKey, callback) {
            console.log(mailData);
            smtpTransport.sendMail(mailData, function (error, response) {
                if (error) {
                    console.log(error);
                    return callback(true, "Error in sending email");
                }
                console.log("Message sent: " + JSON.stringify(response));
                redisClient.set(req.body.email, secretKey);
                redisClient.expire(req.body.email, 900); // expiry for 10 minutes.
                callback(null, "Email sent Successfully");
            });
        }
    ], function (err, data) {
        console.log(err, data);
        res.json({ error: err === null ? false : true, data: data });
    });
});

app.get('/verify', function (req, res) {
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


            let sql = `CALL insCustomerPreRegister1(?)`;
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
    /*  } else {
           res.end("<h1>Request is from unknown source");
     } */
});

/*--------------------Routing Over----------------------------*/

/* app.listen(3000,function(){
	console.log("Express Started on Port 3000");
}); */

module.exports = app;
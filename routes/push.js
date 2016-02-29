var express = require('express');
var gcm = require('node-gcm');
var mysql = require('mysql');

var router = express.Router();

var connection = mysql.createConnection({
	'host' : 'awshomework.csrmmxirvejo.ap-northeast-1.rds.amazonaws.com',
	'user' : 'user',
	'password' : 'q1w2e3r4',
	'database' : 'tookey',
});

var server_api_key = 'AIzaSyB6RY-gKekWvFYpVXwdVxK_Hu3OeTcl99Y';
//var server_api_key = 'AIzaSyAt5J770100VHfM_9AcP1CQ0KauSathm7I';
var sender = new gcm.Sender(server_api_key);

router.get('/register/:token', function(req,res,next){
    connection.query('update users set token=? where uuid='+req.query.uuid+';', [req.params.token], function (error, info){
        if(error == null){
            connection.query('select * from users where id_user=?;',[info.insertId], function (error, cursor){
                if(cursor.length > 0){
                    res.json({
                    result:true, uuid : cursor[0].uuid});
                }
                else
                    res.status(503).json({ result : false, reason : "Cannot find"});
            });
        };
    });
});
router.post('/message', function(req,res,next){
    var registrationIds = [];
    connection.query('select token from users order by rand() limit 5;', function (error, cursor){
        registrationIds.push(cursor[0].token);
        registrationIds.push(cursor[1].token);
        registrationIds.push(cursor[2].token);
        registrationIds.push(cursor[3].token);
        registrationIds.push(cursor[4].token);
    });
    var message = new gcm.Message({
        collapseKey: 'demo',
        delayWhileIdle: true,
        timeToLive: 3,

        data: {
            title: "질문이 도착했습니다.",
            message: req.query.question
        }
    });

    sender.send(message, registrationIds, 4, function(err, result){
        console.log(result);
    });
    //res.status(200).send("Message sent !!");
});

module.exports = router;

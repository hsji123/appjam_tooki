//user.js

var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var connection = mysql.createConnection({
    'host' : 'awshomework.csrmmxirvejo.ap-northeast-1.rds.amazonaws.com',
    'user' : 'user',
    'password' : 'q1w2e3r4',
    'database' : 'tookey',
});


//내가 작성한 카드
router.get('/:uuid/write', function(req, res, next) {
	connection.query('select distinct c.id_card, c.question, cs.answer, c.count_yes, c.count_no, c.count_comment from cards as c left outer join cards_sel as cs on c.id_card=cs.id_card and c.uuid=cs.uuid where c.uuid=?'
                                 +'order by c.regdate desc ;',
                     [req.params.uuid], function (error, cursor) {
        console.log(cursor.length);
	console.log(cursor);
	res.json(cursor);
    });
});


 //내가 y/n한 카드 리스트
router.get('/:uuid/select', function(req, res, next) {
    connection.query('select distinct c.id_card, c.question, cs.answer, c.count_yes, c.count_no, c.count_comment from cards as c, cards_sel as cs where cs.uuid=? and c.id_card=cs.id_card and cs.alarm!=3 '
                     +'order by cs.regdate desc;',
                     [req.params.uuid], function (error, cursor) {
        console.log(cursor.length);
        console.log(cursor);
        res.json(cursor);
    });
});


//내가 댓글단  카드
router.get('/:uuid/comment', function(req, res, next) {
    connection.query('select  c.id_card, c.question, cs.answer, c.count_yes, c.count_no, c.count_comment from cards as c, cards_sel as cs where cs.uuid=? and c.id_card=cs.id_card and cs.alarm=3 '
                     +'order by cs.regdate desc;', 
                     [req.params.uuid], function (error, cursor) {
	console.log(cursor.length);
	res.json(cursor);
    });
});







//카드에 대한 정보 받아오기(alarm)
router.get('/:uuid/alarm', function(req, res, next) {
     connection.query('select cs.id_card, c.question, cs.alarm, cs.regdate from cards_sel as cs, cards as c where cs.uuid=? and c.id_card=cs.id_card and cs.regdate > now() - INTERVAL 7 day order by cs.regdate desc;',
 [req.params.uuid], function (error, cursor) {
 	console.log(cursor);
	res.json(cursor);
       });
})


//첫 방문자 파악 
router.get('/:uuid', function(req, res, next) {
     connection.query('select uuid from users where uuid=? ;',
 [req.params.uuid], function (error, cursor) {
 if(cursor.length>0)
	res.json(cursor[0]);
 else
	res.json({"uuid" : "no"});
       });
});



//사용자 추가 
router.post('/:uuid', function(req, res) {
    var uuid = req.params.uuid;   
    connection.query('insert into users (uuid) values (?);',              
                     [uuid], 
                     function (error, cursor) {
        if (error == null) {
            connection.query('select uuid from users where uuid=?;',[req.params.uuid], 
                             
                             function (error, cursor) {
                if (cursor.length > 0) {
                    res.json({
                        result : true,
                        uuid : cursor[0].uuid,
                    });
                }
               else
                    res.status(503).json({ result : false, reason : "Cannot add user" });
            });
        }
        else
            res.status(503).json(error);
    });                    
});


module.exports = router;

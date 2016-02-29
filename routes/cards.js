//cards.js

var express = require('express');
var mysql = require('mysql');

var router = express.Router();

var connection = mysql.createConnection({
    'host' : 'awshomework.csrmmxirvejo.ap-northeast-1.rds.amazonaws.com',
    'user' : 'user',
    'password' : 'q1w2e3r4',
    'database' : 'tookey',
});


//카드 작성
router.post('/', function(req, res, next) {
    var uuid = req.body.uuid;
    var question = req.body.question;
    var site_x = req.body.site_x;
    var site_y = req.body.site_y;
    
    connection.query('insert into cards (uuid, question, site_x, site_y) values (?,?,?,?);',                         
                     [uuid, question, site_x, site_y], function (error, info) {
        console.log(error);
	console.log(info);
	if (error == null) {
            connection.query('select id_card, question from cards where id_card=?;',[info.insertId], function (error, cursor) {
                console.log(cursor);
		if (cursor.length > 0) {
                    res.json({
                        result : true,
                        id_card : cursor[0].id_card,
                        question : cursor[0].question,
                    });
                }
                else
                    res.status(503).json({ result : false, reason : "Cannot post card" });
            });
        }
        else
            res.status(503).json(error);
        });
});


//yes or no 선택된 카드 정보를 서버에 등록.
router.post('/:id_card/select', function(req, res, next) {
    var alarm=0;
    if(req.body.answer=="yes"){
	alarm=1;
        connection.query('UPDATE cards SET count_yes=count_yes+1 WHERE id_card=?;', [req.params.id_card], function(error, cursor) {});
    }
    else if(req.body.answer=="no"){
        alarm=2;
        connection.query('UPDATE cards SET count_no=count_no+1 WHERE id_card=?;', [req.params.id_card], function(error, cursor) {});
    }
    console.log(req.params.id_card);
    console.log(req.body.uuid);
    console.log(req.body.answer);
    console.log(alarm);
    query="update cards_sel set uuid=\""+req.body.uuid+"\", answer=\""+req.body.answer+"\", alarm="+alarm+" where id_card="+req.params.id_card+" and comment is null;";
    console.log(query);
	connection.query('insert into cards_sel (id_card) values (?);',[req.params.id_card], function(error,info){
		connection.query(query, function(error, cursor){
        		console.log(cursor);
			res.json(cursor); 
		});
	});
});

//yes or no 한 카드에 대한 정보를 클라이언트에 보여줌.
router.get('/:id_card/selected',function(req,res,next){
	connection.query('select id_card, question, count_yes, count_no, count_comment from cards where id_card=?;',
			[req.params.id_card], function (error, cursor) {
		console.log(cursor[0]);
		res.json(cursor[0]);
	});
})




//카드에 대한 댓글 리스트 가져오기
router.get('/:id_card/comment', function(req, res, next) {
     connection.query('select id_card, comment, answer, comment_like from cards_sel where id_card='+req.params.id_card+' and comment!=""  order by regdate desc;', function (error, cursor) {
       if(cursor.length>0){
		console.log(cursor.length)
		res.json(cursor);
	}
       else
	res.json("no");
       });
     });

    
//카드에 대한 댓글 등록    
router.post('/:id_card/comment', function(req, res) {
      console.log(req.body);
      connection.query('insert into cards_sel (uuid, id_card, comment, answer, alarm) values (?,?,?,?,3);',                         
                     [req.body.uuid, req.params.id_card, req.body.comment, req.body.answer], function (error, info) {
        if (error == null) {
      connection.query('update cards set count_comment=count_comment+1 WHERE id_card=?;', [req.params.id_card], function(error, cursor) {});

      connection.query('select id_card,answer, comment, comment_like from cards_sel where id_card=? and alarm=3 order by regdate desc;',[req.params.id_card], function (error, cursor) {
		console.log(cursor);
                if (cursor.length > 0) {
                    res.json({
                        result : true, 
                        answer : cursor[0].answer, 
                        comment : cursor[0].comment,
                    });
                }
                else{
		    console.log(error);
                    res.status(503).json({ result : false, reason : "Cannot post comment" });
		}
            });
        }
        else{
	    console.log(error);
            res.status(503).json(error);
	}
    });
});



//카드 댓글리스트 불러오기 (Top3 + 최신순)
router.get('/:id_card/comment_sort', function(req, res) {
      console.log(req.body);                   
      connection.query('(select cs.id_card, cs.answer, cs.comment_like from cards_sel cs order by comment_like desc limit 3)' +
            ' UNION (select x.id_card, x.answer,  x.comment_like  from (select * FROM cards_sel cs WHERE cs.id_card =? not in(SELECT * FROM' +
                 ' (select cs.id_card from cards_sel cs order by comment_like desc limit 3) as t) order by cs.regdate desc) as x); ' 
             ,[req.params.id_card], function (error, cursor) {
                console.log(cursor);
                 res.json(cursor);
            });
       });


//댓글 좋아요 등록(보류)
router.post('/:id_card/comment_like', function(req, res) {
      	console.log(req.body);
     	connection.query('update cards_sel set comment_like=comment_like+1 WHERE comment=? and id_card=?;', [req.body.comment, req.params.id_card], function(error, cursor) {
		console.log(error);
		connection.query('select id_card, comment_like from cards_sel where comment=? and id_card=?;', [req.body.comment, req.params.id_card], function(error, cursor){
			console.log(cursor[0]);
			res.json(cursor[0]);
		});
	});
});



//댓글 좋아요 등록
//router.post('/:id_card/comment_like', function(req, res) {
//      console.log(req.body);
//      connection.query('insert into cards (id_card,uuid,question,count_yes,count_no,count_comment,comment_like) values (?,?,?,?,?,?,?);',          
//                     [req.body.uuid, req.params.id_card, req.body.question, req.body.count_yes, req.body.count_no, req.body.count_comment, req.body.comment_like], function (error, info) {
//        if (error == null) {
//      connection.query('update cards set comment_like=comment_like+1 WHERE id_card=?;', [req.params.id_card], function(error, cursor) {});
//
//      connection.query('select id_card,question,comment,count_yes,count_no,count_comment,comment_like from cards'
//   +' where id_card=? order by regdate desc;',[req.params.id_card], function (error, cursor) {                            
//                   console.log(cursor);
//                        res.json(cursor);
//		});
//	};
//});
//});

  
//인기 카드 목록 조회(보류)
//router.get('/hottest', function(req, res, next) {
//    connection.query('select id_card, question, count_comment,count_yes, count_no from cards //                     +'order by count_comment desc;', function (query, cursor) {
//	console.log(query);
//	console.log(cursor);
//	res.json(cursor);
		
//    });
//   });




//인기 카드 목록 조회(yes no의합계가 가장 많은 순)
router.get('/hottest/:uuid', function(req, res, next) {
    connection.query('select id_card, question, count_comment,count_yes, count_no, regdate, sum(count_yes + count_no)  from cards '
                     +'where regdate > now() - INTERVAL 1 MONTH and not exists (select distinct cards_sel.id_card from cards_sel where uuid=? and cards_sel.id_card=cards.id_card) group by id_card order by sum(count_yes + count_no) desc limit 10;',[req.params.uuid] ,function (query, cursor) {
      console.log(query);
      console.log(cursor);
      res.json(cursor);

    });
   });


//최신 카드 목록 조회
//router.get('/latest', function(req, res, next) {
//    connection.query('select id_card, question, count_comment, count_yes, count_no  from cards '
//                     +'order by regdate desc limit 4;', function (error, cursor) {
 //       console.log(cursor.length);
//      res.json(cursor);
//    });
//});  




//최신 카드 목록 조회 (내가 선택한 카드 빼고 최근 1달동안의 카드 랜덤 선택)
router.get('/latest/:uuid', function(req, res, next) {
  connection.query('select id_card, question, count_comment, count_yes, count_no, regdate from cards' +' where regdate > now() - INTERVAL 1 MONTH and not exists(select distinct cards_sel.id_card from cards_sel where uuid=? and cards_sel.id_card=cards.id_card)' + ' order by rand() limit 10; ', [req.params.uuid],
function (error, cursor) {
        console.log(cursor.length);
      res.json(cursor);
    });
});




//최신 카드 10개씩 목록 조회
router.get('/latest/:pagenum', function(req, res, next) {
    
    var page = 10;
    var pageNum = req.params.pagenum;
    var start = pageNum*10;
    connection.query('SELECT * FROM cards ORDER BY id_card DESC LIMIT '+start+', '+page+';', function (error, cursor) {
        console.log(cursor.length);
        res.json(cursor);
    });
});

    
//내주변 카드 목록 조회
router.get('/nearby', function(req, res, next) {
    connection.query('SELECT id_card,question, (6371*acos(cos(radians('+req.body.site_x+'))*cos(radians(site_x))*cos(radians(site_y)-radians('+req.body.site_y+'))+sin(radians('+req.body.site_x+'))*sin(radians(site_x)))) AS distance FROM cards WHERE x='+req.body.site_x+' and y='+req.body.site_y+'HAVING distance <= 2 ORDER BY distance LIMIT 0,10;', function (error, cursor) {
        //console.log(cursor.length);
	res.json(cursor);
    });
});



module.exports = router;



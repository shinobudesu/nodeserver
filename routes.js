// 引入模块依赖
const express = require("express");
const path = require("path");
const router = express.Router();
const mysql = require("./mysql.js");
var formidable = require("formidable");
var fs = require("fs");
//处理node request请求
const request = require('request');

//登录
const appid = '';
const secret = '';
const authorizationCode = 'xiaomi';
let sessionKey = null;
let openid = null;

router.get('/login', (req, res) => {
    // 获取到登录后的code
    const { code } = req.query;
    // 向微信服务器发送信息获取到 openid 和 session_key
    request(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=${authorizationCode}`, (err, response, body) => {
        if (err) console.log(err);
        const data = JSON.parse(body);
        /*
        签名校验以及数据加解密涉及用户的会话密钥session_key。 需要保存在服务器
        openid 判断是否是同一个用户
        session_key 判断用户是否失效
    
        data: {
          openid: '**********',
          session_key: '********'
        }
        */
        res.end(JSON.stringify(data))
    })
})


//图片上传
router.post('/upload', (req, res, next) => {
    var form = new formidable.IncomingForm();//既处理表单，又处理文件上传
    //设置文件上传文件夹/路径，__dirname是一个常量，为当前路径
    let uploadDir = path.join(__dirname, "./uploads/");
    form.uploadDir = uploadDir;//本地文件夹目录路径

    form.parse(req, (err, fields, files) => {
        let oldPath = files.cover.path;//这里的路径是图片的本地路径
        let newPath = path.join(path.dirname(oldPath), files.cover.name);
        //这里我传回一个下载此图片的Url
        var downUrl = "https://www.shinobu.cn/uploads/" + files.cover.name;//这里是想传回图片的链接
        fs.rename(oldPath, newPath, () => {//fs.rename重命名图片名称
            res.json({ downUrl: downUrl }).end();
        })
    })
})
function randomn(n) {
    let res = ''
    for (; res.length < n; res += Math.random().toString(36).substr(2).toUpperCase()) { }
    return res.substr(0, n)
}
router.get('/uploads/*', function (req, res) {
    res.sendFile(__dirname + "/" + req.url);
})

//按ID查询文章
// a_id  文章ID
router.get("/api/test", function (req, res, next) {
    res.json('(#^.^#)小米~').end();
});


//查询文章列表
// pagepre 页码范围前
// pagenext 页码范围后
// page 每页条数
router.post("/api/article", function (req, res, next) {
    let sql1 = '', sql2 = '';
    let data = [];
    if (req.body.keywords) {
        let keywords = '%' + req.body.keywords + '%';
        sql1 = "select count(*) as num from article where content like " + mysql.pool.escape(keywords);
        sql2 = "select id,title,headimg,styleid,author,updatedate,authorid from (select *,(@i :=@i + 1) as no from article,(select @i := 0) as it where content like " + mysql.pool.escape(keywords) + " order by updatedate desc)t where t.no  between " + mysql.pool.escape(req.body.pagepre) + " and " + mysql.pool.escape(req.body.pagenext) + "  limit " + req.body.page;
    } else {
        sql1 = "select count(*) as num from article";
        sql2 = "select id,title,headimg,styleid,author,updatedate,authorid from (select *,(@i :=@i + 1) as no from article,(select @i := 0) as it order by updatedate desc)t where t.no  between " + mysql.pool.escape(req.body.pagepre) + " and " + mysql.pool.escape(req.body.pagenext) + "  limit " + req.body.page;
    }
    //查询总页数
    mysql.query(sql1, function (err, rows) {
        if (err) {

        } else {
            data.push(rows);
            //查询当前页
            mysql.query(sql2, function (err, rows) {
                if (err) {

                } else {
                    rows.map(function (item) {
                        item.updatedate = timeFormat(item.updatedate);
                    });
                    data.push(rows);
                    res.json(data).end();
                }

            });
        }
    });
});


//按ID查询文章
// a_id  文章ID
router.post("/api/articlebyid", function (req, res, next) {
    let sql1 = "select * from article where id = " + mysql.pool.escape(req.body.id);
    let data = [];
    mysql.query(sql1, function (err, rows) {
        if (err) { } else {
            data.push({
                status: 'OK',
                code: '200'
            });
            rows.map(function (item) {
                item.createdate = timeFormat(item.createdate);
                item.updatedate = timeFormat(item.updatedate);
            });
            data.push(rows);
            res.json(data).end();
        }
    });
});

// 删除某篇文章
// a_id 文章id
router.post("/api/articledel", function (req, res, next) {
    let sql1 = "delete from  article  where id =" + mysql.pool.escape(req.body.id);
    let data = [];
    mysql.query(sql1, function (err, rows) {
        if (err) { } else {
            data.push({
                status: 'OK',
                code: '200'
            });
            res.json(data).end();
        }

    });
});

// 修改某篇文章
router.post("/api/articleedt", function (req, res, next) {
    let sql1 = "update article " + computedParams(req.body, 'id') + " where id =" + mysql.pool.escape(req.body.id);
    let data = [];
    mysql.query(sql1, function (err, rows) {
        if (err) { } else {
            data.push({
                status: 'OK',
                code: '200'
            });
            res.json(data).end();
        }

    });
});

// 保存新文章
router.post("/api/articleins", function (req, res, next) {
    let sql1 = "insert into article (content,author,styleid,headimg,title,updatedate,authorid) VALUES (?,?,?,?,?,?,?)";
    let data = [];
    let value = [req.body.content, req.body.author, req.body.styleid, req.body.headimg, req.body.title, req.body.updatedate, req.body.authorid];
    mysql.insert(sql1, value, function (err, rows) {
        if (err) { } else {
            data.push({
                status: 'OK',
                code: '200'
            });
            res.json(data).end();
        }

    });
});

//格式化时间
function timeFormat(time) {
    var d = new Date(time);

    var year = d.getFullYear(); //年  
    var month = d.getMonth() + 1; //月  
    var day = d.getDate(); //日  

    var hh = d.getHours(); //时  
    var mm = d.getMinutes(); //分  
    var ss = d.getSeconds(); //秒  

    var clock = year + "-";

    if (month < 10)
        clock += "0";

    clock += month + "-";

    if (day < 10)
        clock += "0";

    clock += day + " ";

    if (hh < 10)
        clock += "0";

    clock += hh + ":";
    if (mm < 10) clock += '0';
    clock += mm + ":";

    if (ss < 10) clock += '0';
    clock += ss;
    return (clock);
}

//编辑返回参数处理
function computedParams(obj, id) {
    let str = "set ";
    for (let a in obj) {
        if (obj[a].trim() != '' && a != id) {
            str += a + '="' + obj[a] + '",';
        }
    }
    str = str.substr(0, str.length - 1);
    return str;
}
module.exports = router;
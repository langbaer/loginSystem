/////创建路径
const express = require('express')
const router = express.Router()

//////加密npm
const bcryptjs = require('bcryptjs')

////加密JWT，验证登入状态
const jwt = require('jsonwebtoken')

/////引入密钥
const config = require('../config')

////引入路径和fs模块
const path = require('path')
const fs = require('fs')



/////接口1 注册新用户
router.post('/api/reguser', (req, res) => {

    ////获取musql数据
    const db = require('../db/index')

    /////接受客户端发的用户名密码
    const userinfo = req.body

    ////判断用户名或者密码是否为空
    if (!userinfo.username || !userinfo.password) {
        return res.send({
            status: 1,
            msg: '用户名或者密码不能为空'
        })
    }
    /////验证库中有没有用户名是一致的

    const sql = 'select * from user where username=?'
    db.query(sql, [userinfo.username], (err, results) => {
        if (err) {
            return res.send({
                status: 1,
                smg: '注册失败,服务器内部错误(验证mysql库中的用户名时)'
            })
        }
        if (results.length > 0) {
            return res.send({
                status: 1,
                msg: '用户名已经被注册'
            })
        }

        ///加密用户的数据

        const encryptPassword = bcryptjs.hashSync(userinfo.password, 10)



        ////用户名不存在，注册用户至数据库,密码是加密过后的密码
        const data = { username: userinfo.username, password: encryptPassword, nickname: userinfo.nickname, email: userinfo.email }
        const regToSql = 'insert into user SET?'
        db.query(regToSql, data, (err, results) => {
            if (err) {
                return res.send({
                    status: 1,
                    msg: '注册失败,服务器内部错误(用户名和密码写入mysql时)'
                })
            }
            if (results.affectedRows === 1) { }
            /////注册成功在服务器自动生成一个用户的文件夹，来存放用户的信息

            ////注册时间信息
            const moment = require('moment')
            const createTime = moment().format('YYY-MM-DD HH:MM:SS')

            ///创建用户文件夹
            const mkdir = require('../mynpm/autocreatefile').mkdirSync
            mkdir(path.join(__dirname, `../users/${userinfo.username}/img`))

            const allData = `用户${userinfo.username}创建了,创建的时间是:${createTime},用户名为:${userinfo.nickname},邮箱是:${userinfo.email}`
            fs.writeFile(path.join(__dirname, `../users/${userinfo.username}/${userinfo.username}log.txt`), allData, 'utf8', function (err) {
                if (err) {
                    console.log('服务器创建用户文件夹失败' + err.message)
                    return res.send({
                        status: 1,
                        msg: ('服务器错误,在user路径/api/login端口创建文件夹失败!')
                    })
                }
                console.log(`注册了一位账号为${userinfo.username}的用户且自动生成了用户文件夹`)
            })

            return res.send({
                status: 0,
                msg: '注册成功！'
            })

        })
    })

})

/////接口2 登入
router.post('/api/login', (req, res) => {

    ////获取musql数据
    const db = require('../db/index')

    /////接受客户端发的用户名密码
    const userinfo = req.body

    ///验证用户身份
    const sql = 'select * from user where username=?'
    db.query(sql, userinfo.username, (err, results) => {
        if (err) {
            return res.send({
                status: 1,
                msg: '注册失败,服务器内部错误(验证用户名时)'
            })
        }

        /////验证是否纯在用户名
        if (results.length === 0) {
            return res.send({
                status: 1,
                msg: '登入失败,用户名或者密码错误(验证用户名时)'
            })
        }

        //////验证密码是否一致
        if (!bcryptjs.compareSync(userinfo.password, results[0].password)) {
            return res.send({
                status: 1,
                msg: '登入失败,用户名或者密码错误(验证密码时)'
            })
        }
        else {
            ///////此时的user信息会被挂载至req的auth上，注意挂载上id号
            const user = { username: results[0].username, email: results[0].email, nickname: results[0].nickname, id: results[0].id }
            let token = jwt.sign(user, config.secretKey, { expiresIn: '10h' })
            return res.send({
                status: 0,
                msg: '登入成功',
                token: 'Bearer ' + token
            })
        }
    })


})

/////接口3 验证登入
router.post('/admin/getinfo', function (req, res) {
    console.log(req.auth)
    res.send({
        status: 200,
        msg: '获取用户信息成功',
        data: req.auth
    })
})



///暴露
module.exports = router
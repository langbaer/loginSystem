/////引入路径
const express = require('express')
const router = express.Router()

////导入数据验证模块
const joi = require('joi')

/////导入加密模块
const bcryptjs = require('bcryptjs')

/////存储头像
const path = require('path')
const multer = require('multer')
const storage = multer.diskStorage({
    destination(req, res, cb) {
        cb(null, path.join(__dirname, `../users/${req.auth.username}/img/`));
    },
    filename(req, file, cb) {
        cb(null, file.originalname);
    }
})
const upload = multer({ storage: storage })


////接口1，用户个人信息
router.get('/userinfo', (req, res) => {
    const db = require('../db/index')
    const data = 'select id,username,nickname,email,user_pic from user where id=?'
    db.query(data, req.auth.id, (err, results) => {
        if (err) {
            return res.send({
                status: 1,
                msg: '服务器内部错误，获取用户数据失败(userinfor接口下访问数据库时)'
            })
        }
        res.send({
            status: 0,
            msg: '获取用户数据成功',
            data: results
        })
    })
})

////接口2，更改用户信息（除密码外）
router.post('/userinfo', (req, res) => {

    //////定义schema为验证模板
    const schema = joi.object({
        username: joi.number().integer().min(1).required(),
        nickname: joi.string().required(),
        email: joi.string().email().required()
    })

    /////验证用户更改的数据是否合适
    const verifySchema = schema.validate(req.body)

    //////更改的数据非法的时
    if (verifySchema.error) {
        return res.send({
            status: 1,
            msg: '修改失败(在验证修改的用户信息时)',
            err: verifySchema.error.details[0].path[0]

        })
    }

    /////更改的数据部非法时
    // console.log(verifySchema.value)

    /////注意，此时直接从Authorization获取客户端id来确认数据库中的身份
    const db = require('../db/index')
    const regToSql = 'update user set ? where id=?'
    db.query(regToSql, [verifySchema.value, req.auth.id], (err, results) => {
        if (err) {
            console.log(err.message)
            return res.send({
                status: 1,
                msg: '服务器内部错误,修改用户数据失败(userinfor接口下访问数据库时)'
            })
        }
        if (results.affectedRows === 1) {
            console.log(`数据库id为${req.auth.id}的用户修改了他的信息`)
            return res.send({
                status: 1,
                msg: '修改成功',
                data: verifySchema.value
            })
        }
    })
})

/////接口3，更改密码
router.post('/updatepwd', (req, res) => {
    ////接受旧密码和新密码
    const changePassword = { oldPwd: req.body.oldPwd, newPwd: req.body.newPwd }



    ////首先验证客户端的id
    const db = require('../db/index')
    const regToSql = 'select password from user where id=?'
    db.query(regToSql, req.auth.id, (err, results) => {
        if (err) {
            return res.send({
                status: 1,
                msg: '服务器内部错误(userinfo路径userpwd端口下验证客户端id)'
            })
        }
        if (results.length !== 1) {
            return res.send({
                status: 1,
                msg: '更改密码失败,未查询到客户端提供的数据库id'
            })
        }
        /////验证用户输入的密码是否符合规范 /// 密码必须由3-30位的英文数字组成 ///不能与旧密码相同
        const schema = joi.object({
            oldPwd: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
            newPwd: joi.not(joi.ref('oldPwd')).concat(joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')))
        })

        //////验证密码表单数据
        const verifySchema = schema.validate(changePassword)

        ////捕获错误并返回
        if (verifySchema.error) {
            return res.send({
                status: 1,
                msg: '修改失败(在验证修改用户密码时)',
                err: verifySchema.error.details[0].path[0]
            })
        }

        ////验证旧密码是否与数据库的一致
        const comparePwd = bcryptjs.compareSync(changePassword.oldPwd, results[0].password)
        if (!comparePwd) {
            return res.send({
                status: 1,
                msg: '修改密码失败,发送的旧密码错误'
            })
        }
        /////加密密码
        const encryptPassword = bcryptjs.hashSync(changePassword.newPwd, 10)
        //////把数据库的数据进行替换
        const updataPwd = 'update user set password=? where id=?'
        db.query(updataPwd, [encryptPassword, req.auth.id], (err, results) => {
            if (err) {
                return res.send({
                    status: 1,
                    msg: '服务器内部错误(userinfo路径userpwd端口下跟新密码时)'
                })
            }
            if (results.affectedRows === 1) {
                return res.send({
                    status: 0,
                    msg: '修改密码成功！'
                })
            }
        })
    })
})

////接口4，修改用户头像
router.post('/updatepic', upload.single('file'), (req, res) => {

    console.log(req.file)
    ///定义验证的规则
    const schema = joi.string().dataUri().required()
    ///验证上传的头像数据
    const verifySchema = schema.validate(req.file)
    console.log(verifySchema)
    if (verifySchema.error) {
        return res.send({
            status: 1,
            msg: '更新头像失败,userpwd路径updatepic接口下验证数据错误',
            data: verifySchema.error.details[0].path[0]
        })
    }
    res.send({
        status: 0,
        msg: '文件接收成功'
    })
})

////暴露router
module.exports = router
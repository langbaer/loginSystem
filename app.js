/////注册服务器
const express = require('express')
const app = express()

/////引入jwt
const config = require('./config')
const { expressjwt: jwt } = require('express-jwt')

////处理客户端上传的信息
app.use(express.urlencoded({ extended: false }))

/////挂载JWT至全局中间件  此时的req已经被挂载了auth
app.use(jwt({ secret: config.secretKey, algorithms: ["HS256"], }).unless({ path: [/\/api\//] }))

///引入路径user文件
const router = require('./router/user')
app.use(router)


///引入实验函数
const router2 = require('./实验')
app.use(router2)

/////引入userinfo
const userinfoRouter = require('./router/userinfo')
app.use('/my', userinfoRouter)

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        return res.send({
            status: 1,
            msg: '身份认证失败,请确认token'
        })
    }
    if (err.name === 'ValidationError') {
        return res.send({

        })
    }
})

///启动服务器
app.listen(80, function () {
    console.log('resver is running at http://127.0.0.1')
})
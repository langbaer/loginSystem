////引入mysql
const mysql = require('mysql')
const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'woqq18296732535',
    database: 'loginsystem'
})

//////暴露出去
module.exports = db
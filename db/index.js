////引入mysql
const mysql = require('mysql')
const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'woqq18296732535',
    database: 'loginsystem'
})
////实验函数mysql
db.query('select * from user', (err, results) => {
    if (err) {
        return console.log(err.message)
    }
    console.log(results)
})

//////暴露出去
module.exports = db
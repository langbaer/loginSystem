const express = require('express')
const router = express.Router()

const multer = require('multer')
const storage = multer.diskStorage({
    destination(req, res, cb) {
        cb(null, 'users/123412311/img/');
    },
    filename(req, file, cb) {
        // const filenameArr = file.originalname.split('.');
        cb(null, file.originalname);
    }
})
const upload = multer({ storage: storage })


router.post('/try', upload.single('file'), (req, res) => {
    console.log(req.file)
    res.send({
        status: 0,
        msg: '成功'
    })
})


module.exports = router
var sse = require('connect-sse')();
var express = require('express')
var router =express.Router();
const {getProgress} = require('../executor')

router.get('/', sse, function (req, res) {

    const interval = setInterval(async () => {
        const status = await getProgress();
        res.json(status + ' ...');
        if(status=='All tasks Complete'){
            res.end()
        }
    }, 200); 

    req.on('close', () => {
        clearInterval(interval);
    });
});

module.exports = router;
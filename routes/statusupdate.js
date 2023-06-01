var sse = require('connect-sse')();
var express = require('express')
var router =express.Router();
const {getRemainingTasks} = require('../executor_bulk')

router.get('/', sse, function (req, res) {

    const interval = setInterval(async () => {
        const status = await getRemainingTasks();
        res.json(status + ' tasks remaining');
        if(status=='0'){
            res.end()
        }
    }, 1000); 

    req.on('close', () => {
        clearInterval(interval);
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getDataFromMongoDB } = require("../services/db")


router.post('/', async (req, res) => {

    try {
        let site = req.body.Site;
        let data = await getDataFromMongoDB(site);
        res.send(data);
        res.status(200);
    }catch{
        res.status(401).send({
            message: `Could not get data: ${err}`,
        });
    }

})


module.exports = router;
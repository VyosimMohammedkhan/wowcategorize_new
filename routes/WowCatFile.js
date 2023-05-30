const csv = require('csv-parser');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const wowCatBulkService = require('../services/WowCatBulkService');
const uploadFile = require("../services/filehandler");


const readFileAsPromise = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
};

const processCSVFile = async (filePath) => {
    try {
        const data = await readFileAsPromise(filePath);
        const csvdata = data;
        const urlList = csvdata.split(',').map((url) => url.trim());

        return urlList;
    } catch (error) {
        console.error('Error reading CSV file:', error);
        return [];
    }
};



router.get('/', (req, res) => {
    res.json({ message: "ok" });

})


router.post('/', async (req, res) => {
    let urlList = [];
    try {
        await uploadFile(req, res);

        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }


        await processCSVFile('./uploads/' + req.file.originalname)
            .then((result) => {
                urlList = result;
            });
        console.log(urlList)


        res.setHeader("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );

        const dataArray = await wowCatBulkService(urlList);
        res.json(dataArray);
        res.status(200);
    } catch (err) {
        res.status(500).send({
            message: `Could not upload the file: ${err}`,
        });
    }

});


module.exports = router;
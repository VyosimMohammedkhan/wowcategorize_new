const express = require('express');
const router = express.Router();
const wowCatBulkService = require('../services/WowCatBulkService');



router.get('/', (req, res) => {
  res.json({ message: "ok" });

})


router.post('/', async function (req, res, next) {

  const urlList = req.body.urlList;
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
 
    
    let urlListArray = urlList.split(/\r?\n|\r|\t/);
    urlListArray= urlListArray.flatMap(line => line.split(/[,|;]/));
    urlListArray= urlListArray.flatMap(element=>element.trim())
    urlListArray= urlListArray.flatMap(element=>element.split(' '))
    urlListArray= urlListArray.filter(element=>element)

    const dataArray = await wowCatBulkService(urlListArray);
    res.json(dataArray);
    res.status(200);
    //console.log(`data for ${url} sent`);
  } catch (err) {
    console.error(`Error fetching data`, err.message);
    next(err);
  }
});


module.exports = router;
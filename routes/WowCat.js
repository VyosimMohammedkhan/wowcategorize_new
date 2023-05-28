const express = require('express');
const router = express.Router();
const wowCatService = require('../services/WowCatService');




router.get('/', (req, res) => {
  res.json({ message: "ok" });

})


router.post('/', async function (req, res, next) {

  const url = req.body.url;
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const dataArray = await wowCatService(url);
    res.json(dataArray);
    res.status(200);
    console.log(`data for ${url} sent`);
  } catch (err) {
    console.error(`Error fetching data`, err.message);
    next(err);
  }
});


module.exports = router;


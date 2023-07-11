const express = require("express");
const app = express();
const cors = require('cors');
const expressWs = require('express-ws')(app);
const PORT =process.env.PORT || 5000;
const categorize = require("./routes/categorize");
const getkeywords =require("./routes/keywordsService")
const categorizeBulk = require("./routes/categorizeBulk")
const dbData = require("./routes/dbData")
const bodyParser = require('body-parser');


app.use(cors());
app.use(express.json({limit: "10mb", extended: true}))
app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit: 50000}))
const bodyParserConfig = {
  json: { limit: '10mb', extended: true },
  urlencoded: { limit: '10mb', extended: true }
};
app.use(bodyParser.json(bodyParserConfig.json));
app.use(bodyParser.urlencoded(bodyParserConfig.urlencoded));

app.use("/keywords", getkeywords)
//app.use("/categorize", categorize);// crawl single url
app.use("/categorizeBulk", categorizeBulk)// crawl multiple urls
app.use("/dbData",dbData )//getting and updating crawled urls from database

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

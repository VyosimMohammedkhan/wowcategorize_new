const express = require("express");
const app = express();
const cors = require('cors');
const PORT =process.env.PORT || 5000;
const wowCat = require("./routes/WowCat");
const getkeywords =require("./routes/keywordsService")
const Bulkategorize = require("./routes/WowCatBulk")
const BulkFile = require("./routes/WowCatFile")
const dbData = require("./routes/dbData")
const ProgressStatus = require('./routes/statusupdate')
const progressPerUrl = require('./routes/progressPerUrl')
const mainPageProgress = require('./routes/progressForMainPage')

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});



app.use("/keywords", getkeywords)
app.use("/wowCat", wowCat);
app.use("/bulkCategorize", Bulkategorize)
app.use("/file", BulkFile)
app.use("/dbData",dbData )
app.use("/status", ProgressStatus)
app.use("/progress", progressPerUrl)
app.use("/mainPageProgress", mainPageProgress)

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})


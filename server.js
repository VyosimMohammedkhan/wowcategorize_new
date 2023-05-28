const express = require("express");
const app = express();
const cors = require('cors');
const PORT =process.env.PORT || 8080;
const wowCat = require("./routes/WowCat");
const getkeywords =require("./routes/keywordsService")


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

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

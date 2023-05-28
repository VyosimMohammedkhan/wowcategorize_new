const {countTotalperCategory, getAllUrlsFromPage, getMetaDataLanguageAndCopyright, countMatchingKeywordsFromGivenSetOfLinks } = require('./helper_function')
const puppeteer = require('puppeteer');
require("dotenv").config();
//const urlbatch = [];

//console.log(urllist);

//general for single url
async function wowCat(url) {

     if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
     }

     console.log(`request recieved for ${url}`);
     const browser = await puppeteer.launch({
          executablePath : process.env.PUPPETEER_EXECUTABLE_PATH,
          devtools: false,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--no-zygote"],
     });

     const dataToReturn = [];
     const page = await browser.newPage();
     page.setDefaultTimeout(0)
     await page.goto(url);

     const urlList = await getAllUrlsFromPage(page);
     page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");
     const metaDataLangCopyright = await getMetaDataLanguageAndCopyright(page, url);
     const categoryData = await countMatchingKeywordsFromGivenSetOfLinks(urlList, url);

     dataToReturn.push(categoryData);
     dataToReturn.push(metaDataLangCopyright);
     dataToReturn.push(countTotalperCategory(categoryData))

     await browser.close();

     return dataToReturn;
}



module.exports = wowCat;

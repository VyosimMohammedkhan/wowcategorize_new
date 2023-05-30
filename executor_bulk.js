const { countTotalperCategory, getAllUrlsFromPage, getMetaDataLanguageAndCopyright, countMatchingKeywordsFromGivenSetOfLinks } = require('./helper_function')
const { Cluster } = require('puppeteer-cluster')
const { MongoClient } = require('mongodb');
const { sendDataToMongoDB } = require('./services/db');
// const fs = require('fs');
// const csv = require('csv-parser');
const ObjectsToCsv = require('objects-to-csv');


//const urlbatch = fs.readFileSync('output.csv').toString().split('\n');
//urlbatch.shift();
let urlbatch = ["naukri.com", "facebook.com", "freecodecamp.com", "w3schools.com"];

//let batches = divideArrayIntoFiveSmallerArrays(urlbatch);
//console.log(batches)

async function wowCatBulk(urlbatch) {
     let dataObject = {};

     const cluster = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          maxConcurrency: 8,
          puppeteerOptions: {
               args: ["--no-sandbox", "--disable-setuid-sandbox", "--fast-start", "--disable-extensions"],
             }
     });

     await cluster.task(async ({ page, data: url }) => {

          page.setDefaultTimeout(0)
          page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");

          if (!url.startsWith("http://") && !url.startsWith("https://")) {
               url = "https://" + url.trim();
          } else {
               url = url.trim();
          }

          console.log(`request recieved for ${url}`);
          try {
               await page.goto(url);
               const urlList = await getAllUrlsFromPage(page);
               const metaDataLangCopyright = await getMetaDataLanguageAndCopyright(page, url);
               const categoryData = await countMatchingKeywordsFromGivenSetOfLinks(urlList, url);

               const totalCount = await countTotalperCategory(categoryData);
               const metaData = metaDataLangCopyright

               let data = { categoryData, totalCount, metaData }
               dataObject[url] = [categoryData, totalCount, metaData];
               let datainserted = false;
               while (!datainserted) {
                    try {
                         await sendDataToMongoDB(data);
                         datainserted = true;
                    } catch (error) {
                         console.log("trying to insert data again")
                    }
               }

          } catch (error) {
               console.log("failed for : " + url + " due to " + error)
               if (url.includes('https')) {
                    cluster.queue(url.replace('https', 'http'));
               } else {
                    await new ObjectsToCsv([{ url: url, erorr: error.toString() }]).toDisk('./failedUrl.csv', { append: true });
               }
          }
     });

     for (let url of urlbatch) {
          cluster.queue(url);
     }


     await cluster.idle();
     await cluster.close();

     return dataObject;
}



//wowCatBulk().then(() => { console.log("done") })

module.exports = wowCatBulk;

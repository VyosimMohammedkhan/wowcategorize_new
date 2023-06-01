const { countTotalperCategory, getAllUrlsFromPage, getMetaDataLanguageAndCopyright, countMatchingKeywordsFromGivenSetOfLinks } = require('./helper_function')
const puppeteer = require('puppeteer');
const { getDataFromMongoDB, sendDataToMongoDB } = require('./services/db');
//const urlbatch = [];

//console.log(urllist);

//general for single url

let progress = 'loading ... '
async function wowCat(url) {
     console.log(typeof (url))
     if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
     }

     console.log(`request recieved for ${url}`);
     let datainDB = await getDataFromMongoDB(url);
     await setProgress('Checking if data exists in db for ' + url);

     const dataToReturn = [];
     if (!datainDB) {
          try {
               await crawler(url, dataToReturn)
          } catch {
               try {
                    setProgress('could not navigate to '+url+ '. Trying again with http')
                    await crawler(url.replace('https', 'http'), dataToReturn)
               } catch(error){
                    setProgress('could not navigate to url : ' + error)
                    console.log('could not navigate to url : '+ error)
               }
          }

     } else {
          await setProgress('Data exists in DB. getting data from DB');
          dataToReturn.push(datainDB.categoryData);
          dataToReturn.push(datainDB.metaData);
          dataToReturn.push(datainDB.totalCount)
     }
     await setProgress('All tasks Complete');
     return dataToReturn;
}

async function setProgress(p) {
     progress = p;
}

async function getProgress() {
     return progress;
}


async function crawler(url, dataToReturn) {
     const browser = await puppeteer.launch({
          devtools: false,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--fast-start", "--disable-extensions"],
     });

     const page = await browser.newPage();
     page.setDefaultTimeout(0)
     await setProgress('No data in DB for ' + url + ' Navigating to url')
     await page.goto(url);
     page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");
     await setProgress('getting all urls from Page')
     const urlList = await getAllUrlsFromPage(page);
     await setProgress('getting metadata from Page')
     const metaDataLangCopyright = await getMetaDataLanguageAndCopyright(page, url);
     await setProgress('getting count of matched keywords')
     const categoryData = await countMatchingKeywordsFromGivenSetOfLinks(urlList, url);

     let totalCount = countTotalperCategory(categoryData)
     dataToReturn.push(categoryData);
     dataToReturn.push(metaDataLangCopyright);
     dataToReturn.push(totalCount)
     let metaData= metaDataLangCopyright

     let data = { categoryData, totalCount, metaData }
     let datainserted = false;
     await setProgress('inserting data to db');
     for (let i = 0; i < 3; i++) {
          if (!datainserted) {
               try {
                    await sendDataToMongoDB(data);
                    datainserted = true;
                    break;
               } catch (error) {
                    if (i < 2) {
                         console.log("trying to insert data again")
                    } else {
                         console.log("failed to insert data in DB"+ error)
                    }
               }
          }
     }

     datainserted ? await setProgress('data inserted successfully') : await setProgress('data insertion failed');

     await browser.close();
}



module.exports = { wowCat, setProgress, getProgress };

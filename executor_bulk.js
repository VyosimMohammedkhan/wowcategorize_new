const { sendExcludeData, isPageExclude, countTotalperCategory, getAllUrlsFromPage, getMetaDataLanguageAndCopyright, countMatchingKeywordsFromGivenSetOfLinks } = require('./helper_function')
const { Cluster } = require('puppeteer-cluster')
const { MongoClient } = require('mongodb');
const { getDataFromMongoDB, sendDataToMongoDB } = require('./services/db');
const ObjectsToCsv = require('objects-to-csv');

let urlbatch = ["naukri.com", "facebook.com", "freecodecamp.com", "w3schools.com"];
let size = 1;
let progress = 'loading ... '
async function wowCatBulk(urlbatch) {
     let dataObject = {};
     size = urlbatch.length;
     await setRemainingTasks(size)
     const cluster = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          timeout: 20 * 1000,
          maxConcurrency: 8,
          puppeteerOptions: {
               args: ["--no-sandbox", "--disable-setuid-sandbox", "--fast-start", "--disable-extensions"],
          }
     });

     await cluster.task(async ({ page, data: url }) => {

          //page.setDefaultTimeout(0)
          await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");

          if (!url.startsWith("http://") && !url.startsWith("https://")) {
               url = "https://" + url.trim();
          } else {
               url = url.trim();
          }
          console.log('url is ' + url)
          let datainDB = await getDataFromMongoDB(url);

          await setProgress('Checking if data exists in db for '+url);
          if (!datainDB) {

               console.log(`request recieved for ${url}`);
               try {
                    await setProgress(`data does not exist in db. navigating to ${url}`)
                    await page.goto(url);
                    let excludePage = await isPageExclude(page);

                    if (!excludePage.exclude) {
                         await setProgress('getting hrefs from '+ url)
                         const urlList = await getAllUrlsFromPage(page);
                         await setProgress('getting metaData from '+ url)
                         const metaDataLangCopyright = await getMetaDataLanguageAndCopyright(page, url); 
                         await setProgress('checking counts of matched keywords for '+ url)
                         const categoryData = await countMatchingKeywordsFromGivenSetOfLinks(urlList, url);

                         const totalCount = await countTotalperCategory(categoryData);
                         const metaData = metaDataLangCopyright

                         let data = { categoryData, totalCount, metaData }
                         dataObject[url] = [categoryData, totalCount, metaData];
                         let datainserted = false;
                         await setProgress('inserting data to db for '+ url );
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
                                             console.log("failed to insert data in DB")
                                        }
                                   }
                              }
                         }
                         size--;
                         await setRemainingTasks(size)
                         datainserted?await setProgress('data inserted successfully for '+url):await setProgress('data insertion failed for '+url);
                    } else {
                         await setProgress('Site contains Exclude keywords')
                         let excludeData = sendExcludeData(url, excludePage.wordmatched);
                         dataObject[url] = excludeData;
                         let categoryData = excludeData[0]; let totalCount = excludeData[1]; let metaData = excludeData[2];
                         let data = { categoryData, totalCount, metaData }
                         console.log(data)
                         let datainserted = false;
                         await setProgress('inserting data to db for ' +url);
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
                                             console.log("failed to insert data in DB")
                                        }
                                   }
                              }
                         }
                         size--;
                         await setRemainingTasks(size)
                         datainserted?await setProgress('data inserted successfully for '+url):await setProgress('data insertion failed for '+url);
                    }

               } catch (error) {
                    console.log("failed for : " + url + " due to " + error)
                    await setProgress(`failed to navigate to ${url} using https. Will try again with http`)
                    if (url.includes('https')) {
                         cluster.queue(url.replace('https', 'http'));
                         size++;
                         await setRemainingTasks(size)
                    } else {
                         await setProgress('failed to categorize '+url);
                         await new ObjectsToCsv([{ url: url, erorr: error.toString() }]).toDisk('./failedUrl.csv', { append: true });
                    }
               }
          } else {
               await setProgress('Data exists in DB. getting data from DB for '+url)
               console.log('data exists in DB. skipping crawling')
               //console.log(datainDB.totalCount)
               dataObject[url] = [datainDB.categoryData, datainDB.totalCount, datainDB.metaData]
               size--;
          }
     });

     for (let url of urlbatch) {
          cluster.queue(url);
     }


     await cluster.idle();
     await cluster.close();
     await setProgress('All tasks Complete')
     return dataObject;
}

async function setRemainingTasks(s) {
     size = s;
}


async function getRemainingTasks() {
     return size
}

async function setProgress(p) {
     progress = p;
}

async function getProgress() {
     return progress;
}
//wowCatBulk().then(() => { console.log("done") })

module.exports = { wowCatBulk, setRemainingTasks, getRemainingTasks ,getProgress};

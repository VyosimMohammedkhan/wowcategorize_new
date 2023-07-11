const { createExcludeData, addhttps, isPageExclude, getAllUrlsFromPage, getMetaDataLanguageAndCopyright } = require('./helper_function')
const { Cluster } = require('puppeteer-cluster')
const { getDataFromMongoDBForBulkDomains, sendSiteHTMLDataToMongoDB } = require('./db');

async function getDataForBulkUrl(urlbatch, recrawl, ws) {
     let dataObject = {};
     let urlList = urlbatch;
     tasks = urlList.length;
     await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));

     //if recrawl is NOT checked, data will be fetched from database

     if (recrawl == false) {
          await ws.send(JSON.stringify({ progressStatus: "Checking in Database for given Domains..." }))
          let dataFromDB = await getDataFromMongoDBForBulkDomains(urlList)
          urlList = dataFromDB[1]
          await ws.send(JSON.stringify(dataFromDB[0]));
          tasks = urlList.length;
          await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));
     }

     await ws.send(JSON.stringify({ progressStatus: "preparing to crawl..." }))
     //cluster is launched
     const cluster = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          timeout: 5 * 60 * 1000,
          maxConcurrency: 8,
          puppeteerOptions: {
               args: ["--no-sandbox", "--disable-setuid-sandbox", "--fast-start", "--disable-extensions"],
          }
     });

     await cluster.task(async ({ page, data: url }) => {

          //setting userAgent and adding https to url
          await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36");
          url = addhttps(url)
          let siteHTML = {} // this is where we will save all siteData to send to db


          try {
               await ws.send(JSON.stringify({ progressStatus: `navigating to ${url}...` }))
               let isPageLoaded = await naviateToUrl(page, url);
               url = isPageLoaded.url;

               //if page is loaded properly with https crawl and get data from it
               if (isPageLoaded.UrlWorking) {
                    await ws.send(JSON.stringify({ progressStatus: `${url} loaded, checking for Exclude keywords...` }))
                    let excludePage = await isPageExclude(page);
                    if (!excludePage.exclude) {
                         await ws.send(JSON.stringify({ progressStatus: `no exclude keywords on ${url}, getting data from page...` }))
                         dataObject[url] = await crawl(page, url);

                         try {// dont want sitedata errors to affect categorization process
                              await ws.send(JSON.stringify({ progressStatus: `downloading HTML data for ${url}...` }))
                              siteHTML = await getSiteData(page, url)
                              await sendSiteHTMLDataToMongoDB(siteHTML)
                         } catch (err) {
                              console.log(err.message)
                              await ws.send(JSON.stringify({ progressStatus: `couldn't download HTMLdata for ${url}...` }))
                         }

                    } else {
                         await ws.send(JSON.stringify({ progressStatus: `found exclude keywords on ${url}, not crawling...` }))
                         dataObject[url] = createExcludeData(url, excludePage)
                    }
                    //otherwise change https to http and add to queue. if already http then mark as failed url with its error message
               } else {
                    if ((isPageLoaded.url).includes('https')) { //&& isPageLoaded.errorMessage.includes("NAME_NOT_RESOLVED")) {
                         await ws.send(JSON.stringify({ progressStatus: `${url} is not working with https...will try with http again...` }))
                         cluster.queue(url.replace('https', 'http'));
                         tasks++;
                         await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));
                    } else {
                         await ws.send(JSON.stringify({ progressStatus: `Failed to load ${url}...` }))
                         dataObject[url] = [{ 'Site': url, 'error': isPageLoaded.errorMessage }];
                    }
               }

               //decrement task count and send to frontend 
               tasks--;
               await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));
               //if there is any data to send then send it.
               if (dataObject[url]) {
                    await ws.send(JSON.stringify({ progressStatus: `finished crawling ${url}...` }))
                    await ws.send(JSON.stringify([dataObject[url]]));
               }

          } catch (err) {
               tasks--;
               await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));
               //if execution context was dstroyed then add the task back to queue and increment task count
               if (err.message.includes("Execution context was destroyed")) {
                    await ws.send(JSON.stringify({ progressStatus: `unexpected error occured while crawling ${url}...adding for recrawl...` }))
                    cluster.queue(page.url())
                    tasks++;
                    await ws.send(JSON.stringify({ taskcount: tasks + ' URLs remaining' }));
                    //otherwise marks as failed url and send with its error message
               } else {
                    await ws.send(JSON.stringify({ progressStatus: `failed to crawl ${url}...` }))
                    await ws.send(JSON.stringify([[{ 'Site': url, 'error': err.message }]]));
               }
               console.log(err.message)
          }
     })

     //adding urls to queue
     for (let url of urlList) {
          cluster.queue(url);
     }

     await cluster.idle();
     await ws.send(JSON.stringify({ progressStatus: `All done...` }))//just before closing the cluster
     await cluster.close();
}


//work functions ------------------------------------------------------------------------------------------------------------------------
async function naviateToUrl(page, url) {
     let UrlWorking = true;
     let errorMessage = '';
     try {
          await page.goto(url, {
               networkIdleTimeout: 5000,
               waitUntil: 'domcontentloaded',
               timeout: 60 * 1000
          })
     } catch (error) {
          UrlWorking = false;
          errorMessage = error.message;
          console.log(errorMessage)
     }

     return { UrlWorking, errorMessage, url };
}

async function crawl(page, url) {
     const urlList = await getAllUrlsFromPage(page);
     const metaData = await getMetaDataLanguageAndCopyright(page, url);
     let dataObject = {};
     dataObject.urlList = urlList
     dataObject.metaData = metaData;
     return dataObject
}

//method for downloading site html data. need to refactor
async function getSiteData(page, domainUrl) {
     let url = domainUrl
     let siteData = { url: url }

     let keywords = {
          "About": ["About", "Company", "Enterprise", "Corporate", "History", "Values", "Mission", "Vision", "Story", "What we do", "Who we are", "Who we serve", "Firm", "Profile"],
          "Contact": ["Contact", "Office", "Location", "Map", "Direction", "Get in touch", "Submit", "Send", "Form", "Consult", "Consultation", "Appointment", "Request", "Free"],
          "Team": ["Team", "Management", "Leadership", "Leaders", "Founder", "Staff", "People", "Meet", "Partner", "Board", "Committee", "Trustee", "President", "Owner", "Director", "Chair"]
     }

     //getting anchorTags and selecting the suburls that contain keywords
     let anchorTags = await page.$$('a');
     let subUrls = await findHrefsContainingKeywords(anchorTags, keywords, url)
     //getting html data of homepage and putting it to siteData
     let homePageHtmlData = await getHtmlDataFromPage(page)
     siteData.homePage = homePageHtmlData;

     //getting html for selected suburls
     for (let [subUrl, linkText] of subUrls) {
          await naviateToUrl(page, subUrl);
          let subPageHtmlData = await getHtmlDataFromPage(page);
          siteData[`${linkText}`] = subPageHtmlData;
     }
     return siteData
}

async function findHrefsContainingKeywords(anchorTags, keywords, url) {

     let subUrls = new Set();
     for (let anchorTag of anchorTags) {
          let href = await anchorTag.getProperty('href');
          let hrefValue = await href.jsonValue();
          hrefValue = new URL(hrefValue, url).href
          let linkText = await (await anchorTag.getProperty('textContent')).jsonValue();

          let flattenedKeywords = [...Object.values(keywords)].flat()
          for (let keyword of flattenedKeywords) {
               if ((linkText.toLowerCase().includes(keyword.toLowerCase()) || hrefValue.includes(keyword.toLowerCase)) && ![...subUrls].flat().includes(hrefValue) && !hrefValue.includes("javascript:void(0)") && !hrefValue.includes("mailto:")) {
                    subUrls.add([hrefValue, linkText.replace(/\s+/g, ' ').replaceAll('.', '').trim()]);
               }
          }
     }
     return subUrls;
}



async function getHtmlDataFromPage(page) {
     let content = await page.evaluate(() => {
          const body = document.querySelector('body');
          let content = '';
          if (body.innerHTML) {
               content = body.innerHTML;
          } else if (document.querySelector('frameset')) {
               content = document.querySelector('frameset').innerHTML;
          }
          //for removing indentation
          content = content.replace(/^[^\S\r\n]+/gm, '');
          //for removing comments
          content = content.replace(/<!--[\s\S]*?-->/g, '');
          //for removing scripts and style tags
          content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
          //to remove onload attribute.(otherwise function not found error may occur on rendering)
          content = content.replace(/onload\s*=\s*['"][^'"]*['"]/gi, '');
          return content;
     },);
     return content;
}


module.exports = { getDataForBulkUrl };

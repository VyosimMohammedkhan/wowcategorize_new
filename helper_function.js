const puppeteer = require('puppeteer');
let keywords = require("./services/keywords.json");
//const fs = require('fs')
//  let keywords = {
//   "About": ["About", "Company", "Enterprise", "Corporate", "History", "Values", "Mission", "Vision", "Story", "What we do", "Who we are", "Who we serve","Firm", "Profile"],
//   "Contact": ["Contact", "Office", "Location", "Map", "Direction", "Get in touch", "Submit", "Send", "Form", "Consult", "Consultation", "Free", "Appointment", "Request"],
//   "Team": ["Management", "Leadership", "Leaders", "Founder", "Staff", "People", "Meet", "Partner", "Board", "Committee", "Trustee", "President", "Owner", "Director", "Chair"],
//   "Investor": ["Investor"],
//   "Product": ["Product", "Service", "Solution", "Compare", "Demo", "Feature", "Portfolio", "Featured", "Practice", "Area", "Project"],
//   "Career": ["Career", "Jobs", "Hiring", "Employment"],
//   "News": ["News", "Press", "Newsroom", "Awards", "Press kit"],//temporarily removed keyword "PR"
//   "ECommerce": ["E-Commerce", "Cart", "Store", "Shop"],
//   "Resources": ["Resources", "Support", "Download", "Chat", "Schedule", "Developers", "FAQ", "Tour", "Help", "Webinar", "Community", "Marketplace", "Feedback", "Knowledge"],
//   "Pricing": ["Pricing", "Offer", "Special", "Deal"],
//   "Social": ["Social", "Facebook,", "Twitter", "Instagram", "Youtube", "LinkedIn", "RSS", "Feed", "Houzz", "Pinterest"],
//   "Portal": ["Portal", "Login", "Sign in", "Sign up", "Cart", "Subscribe", "Log in", "Register", "Stay in touch"],
//   "Legal": ["Legal", "Privacy", "Terms", "Disclaimer"],
//   "Blog": ["Articles", "Customer Stories", "Testimonials", "Reviews", "Newsletter", "Gallery", "Photo", "Guide", "Case Studies", "White Papers", "Client", "Event"],
//   "Exclude": ["Page Not found", "lorem ipsum", "domain for sale", "parked for free"]
// };

// fs.watchFile('./services/keywords.json', () => {
//   // Re-read the keywords.json file
//   fs.readFile('./services/keywords.json', 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading keywords.json file:', err);
//     } else {
//       try {
//         // Update the keywords variable with the new contents
//         keywords = JSON.parse(data);
//         console.log('Keywords updated');
//       } catch (error) {
//         console.error('Error parsing keywords.json data:', error);
//       }
//     }
//   });
// });

async function removeKeyword(category, keywordToRemove){
if(keywords[category].indexOf(keywordToRemove)!=-1){
  keywords[category].splice(keywords[category].indexOf(keywordToRemove),1);
  fs.writeFile("./services/keywords.json", JSON.stringify(keywords), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(keywords));
    console.log('writing to keywords');
  });
}
}

function addKeyword(category, keywordToAdd){
  if(keywords[category].indexOf(keywordToAdd)==-1){
    keywords[category].push(keywordToAdd);
  }
}

async function getAllUrlsFromPage(page) {
//console.log("started getting all urls from page")
  const PageUrlsAndUrlTexts = await page.evaluate(() => {
    const urlHrefAndTextArray = Array.from(document.links).map((link) => [link.href, link.text]);
    const uniqueUrlArray = [...new Set(urlHrefAndTextArray)];
    return urlHrefAndTextArray;
  })
 // console.log("finished getting all urls from page")
  return PageUrlsAndUrlTexts;
}

async function getMetaDataLanguageAndCopyright(page, url) {
 // console.log("started getting metadata")
  let metanamesLanguage = {};
  let pagemetaNames = await getMetaNames(page);
  let pageLanguage = await getLanguages(page);


  metanamesLanguage.Site=url;
  for (let [key, value] of Object.entries(pagemetaNames)) {
    metanamesLanguage[`${key}`] = value;
  };
  for (let [key, value] of Object.entries(pageLanguage)) {
    metanamesLanguage[`${key}`] = value;
  };
  metanamesLanguage.copyright=await getCopyrightText(page);
 // console.log("finished getting metadata")
  return metanamesLanguage;
}


async function countMatchingKeywordsFromGivenSetOfLinks(PageUrlsAndUrlTexts, url) {

  let csvData = [];
  for (const UrlsAndUrlText of PageUrlsAndUrlTexts) {
    try {
      const keywordMatchCountData = await checkKeywordsOnUrl(`${UrlsAndUrlText}`);
      keywordMatchCountData.Site=url
      csvData.push(keywordMatchCountData);
    } catch (error) {
      console.log(`failed to classify ${url}`)
      console.log(error)
      continue;
    }
  }
  return csvData;
}


async function checkKeywordsOnUrl(urlHrefAndTextArray) {
  const urlAndTextArray = urlHrefAndTextArray.split(",");
  let Categories = { "HREF": urlAndTextArray[0], "linkText": urlAndTextArray[1].replace(/\r?\n|\r/g, ""), "About": "", "Contact": "", "Team": "", "Investor": "", "Product": "", "Career": "", "News": "", "ECommerce": "", "Resources": "", "Pricing": "", "Social": "", "Portal": "", "Legal": "", "Blog": "", "keywordFound":"None"};
  let keywordsArry = Object.entries(keywords);
  Categories.linkText=Categories.linkText.replace(/\s+/g, ' ').trim();
  for (let [category, keywordset] of keywordsArry) {
    const word = category.toString()
    // let count=Categories[`${word}`];
    for (let keyword of keywordset) {
      if (Categories.HREF.toLowerCase().includes(keyword.toLowerCase()) || Categories.linkText.toLowerCase().includes(keyword.toLowerCase())) {
        Categories[`${word}`] = 1;
        if(Categories.keywordFound=="None"){
          Categories.keywordFound=keyword;
        }else{
          Categories.keywordFound=Categories.keywordFound+", "+keyword;
        }
        
      }
    }
  }
  return Categories;
}

async function getMetaNames(page) {

  let getMetaData = await page.evaluate(() => {
    let metaDataMap = new Map();

    let titleContent = document.title;
    metaDataMap.metaTitleContent = titleContent ? titleContent : null;

    let httpContenType = document.querySelector('meta[http-equiv="Content-Type"]')
    metaDataMap.metaContenType = httpContenType ? httpContenType.getAttribute('content') : null;

    let keywords = document.querySelector('meta[name="keywords"]')
    metaDataMap.metaKeywords = keywords ? keywords.getAttribute('content') : null;

    let desc = document.querySelector('meta[name="description"]')
    metaDataMap.metaDescription = desc ? desc.getAttribute('content') : null;

    let ogTitle = document.querySelector('meta[property="og:title"]')
    metaDataMap.metaOgTitle = ogTitle ? ogTitle.getAttribute('content') : null;

    let ogDescription = document.querySelector('meta[property="og:description"]')
    metaDataMap.metaOgDescription = ogDescription ? ogDescription.getAttribute('content') : null;

    let ogUrl = document.querySelector('meta[property="og:url"]')
    metaDataMap.metaOgUrl = ogUrl ? ogUrl.getAttribute('content') : null;

    let ogSitename = document.querySelector('meta[property="og:site_name"]')
    metaDataMap.metaOgSitename = ogSitename ? ogSitename.getAttribute('content') : null;

    let profileUsername = document.querySelector('meta[property="profile:username"]')
    metaDataMap.metaProfileUsername = profileUsername ? profileUsername.getAttribute('content') : null;

    let profileFirstname = document.querySelector('meta[property="profile:first_name"]')
    metaDataMap.metaProfileFirstname = profileFirstname ? profileFirstname.getAttribute('content') : null;

    let profileLastname = document.querySelector('meta[property="profile:last_name"]')
    metaDataMap.metaprofileLastname = profileLastname ? profileLastname.getAttribute('content') : null;

    return metaDataMap;
  })
  return getMetaData;
}

async function getLanguages(page) {

  let getLanguagesData = await page.evaluate(() => {
    let languageDataMap = new Map();

    let charSet = document.querySelector('meta[charset=""]')
    languageDataMap.languageCharSet = charSet ? charSet.getAttribute('charset') : null;

    let contentLanguage = document.querySelector('meta[http-equiv="Content-Language"]')
    languageDataMap.contentLanguage = contentLanguage ? contentLanguage.getAttribute('content') : null;

    let languageLocale = document.querySelector('meta[property="og:locale"]')
    languageDataMap.languageLocale = languageLocale ? languageLocale.getAttribute('content') : null;

    let htmlLang = document.querySelector('html')
    languageDataMap.languageHtmtlLang = htmlLang ? htmlLang.getAttribute('lang') : null;

    return languageDataMap;
  })
  return getLanguagesData;
}


async function getCopyrightText(page) {

  const elementsWithSymbol = await page.$x("//*[contains(text(), '©')]");
  if (elementsWithSymbol.length > 0) {
    const textContent = await page.evaluate(element => element.textContent, elementsWithSymbol[0]);
    corrections={
      [/\s+/g]:" ",
      [/\r?\n|\r/g]:""
    }
     return textContent.replace([/\s+/g]|[/\r?\n|\r/g], matched => corrections[matched]);
  } else {
    return "NOT FOUND!";
  }

}


function countTotalperCategory(data){
let countArray={ "About": 0, "Contact": 0, "Team": 0, "Investor": 0, "Product": 0, "Career": 0, "News": 0, "ECommerce": 0,
 "Resources": 0, "Pricing": 0, "Social": 0, "Portal": 0, "Legal": 0, "Blog": 0};
  
data.forEach((webpage)=>{
webpage.About==1? countArray.About++:null;
webpage.Contact==1? countArray.Contact++:null;
webpage.Team==1? countArray.Team++:null;
webpage.Investor==1? countArray.Investor++:null;
webpage.Product==1? countArray.Product++:null;
webpage.Career==1? countArray.Career++:null;
webpage.News==1? countArray.News++:null;
webpage.ECommerce==1? countArray.ECommerce++:null;
webpage.Resources==1? countArray.Resources++:null;
webpage.Pricing==1? countArray.Pricing++:null;
webpage.Social==1? countArray.Social++:null;
webpage.Portal==1? countArray.Portal++:null;
webpage.Legal==1? countArray.Legal++:null;
webpage.Blog==1? countArray.Blog++:null;
})


return countArray;
}

//not useful anymore
function divideArrayIntoFiveSmallerArrays(largeArray) {
  let sizeOfSmallerArrays = Math.ceil(largeArray.length / 5);
  let newDividedArray = []
  for (let i = 0; i <5; i++) {
    newDividedArray.push(largeArray.splice(0, sizeOfSmallerArrays));
  }
  return newDividedArray;
}



module.exports = { divideArrayIntoFiveSmallerArrays, countTotalperCategory,getMetaDataLanguageAndCopyright, getAllUrlsFromPage, countMatchingKeywordsFromGivenSetOfLinks, getMetaNames, getLanguages, getCopyrightText }
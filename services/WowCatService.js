//const db = require('./db');
const {wowCat} = require('../executor');
const config = require('../config');
//const {sendDataToMongoDB} = require('./db')

async function wowCatService(URL){
    
let dataArray= await wowCat(URL);
let metaData=dataArray[1];
let totalCount=dataArray[2];

//only uncomment when not using puppeteer-cluster
// sendDataToMongoDB({
//   totalCount, 
//   metaData
// })

  return dataArray;
}

module.exports= wowCatService

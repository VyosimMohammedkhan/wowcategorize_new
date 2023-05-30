//const db = require('./db');
const wowCatBulk = require('../executor_bulk');
const config = require('../config');
//const {sendDataToMongoDB} = require('./db')

async function wowCatBulkService(urlList){

let dataArray= await wowCatBulk(urlList);
  return dataArray;
}

module.exports= wowCatBulkService
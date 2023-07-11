const { query } = require('express');
const { MongoClient } = require('mongodb');

async function sendDataToMongoDB(data) {
  const site = data.url;
  //const uri = "mongodb+srv://vyosimmohammedk:Vyosim%402023@wowcategorize.opwfdbe.mongodb.net?retryWrites=true&w=majority";
  const uri ="mongodb://localhost:27017"
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('categories');

    const result = await collection.updateOne({ 'url': site }, { $set: data }, { upsert: true });
    console.log(`Document updated for ${site} with id: ${result.upsertedId}`);

  } catch (error) {
    console.error('Error occurred while sending data to MongoDB:', error);
  } finally {
    client.close();
  }
}

async function getDataFromMongoDB(Site) {

  //const uri = "mongodb+srv://vyosimmohammedk:Vyosim%402023@wowcategorize.opwfdbe.mongodb.net?retryWrites=true&w=majority";
  const uri ="mongodb://localhost:27017"
  const client = new MongoClient(uri);

  try {

    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('categories');
    const data = await collection.findOne({ 'url': Site });
    return data;

  } catch (error) {

    console.error('Error occurred while retrieving data from MongoDB:', error);

  } finally {

    client.close();

  }
}

async function getDataFromMongoDBForBulkDomains(urlList) {
  //const uri = "mongodb+srv://vyosimmohammedk:Vyosim%402023@wowcategorize.opwfdbe.mongodb.net?retryWrites=true&w=majority";
  const uri ="mongodb://localhost:27017"
  const client = new MongoClient(uri);

  try {

    urlList = urlList.map(url => {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "https://" + url;
      }
      return url = url.trim();
    })

    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('categories');

    // let data=await fetchData(urlList, collection)
    // let urlsfound = data.map(obj => obj);

    const query = { 'url': { $in: urlList } };
    let data = await collection.find(query).toArray();

    urlsfound = data.map(obj => obj['url']);
    let urlsToCrawl = urlList.filter(url => !urlsfound.includes(url));
    console.log('urls found : ', urlsfound)
    console.log('urls to crawl : ', urlsToCrawl)
    return [data, urlsToCrawl];

  } catch (error) {

    console.error('Error occurred while retrieving data from MongoDB:', error);

  } finally {

    client.close();

  }
}


async function sendSiteHTMLDataToMongoDB(data) {
  console.log(data.url)
  const site = data.url;
  const uri ="mongodb://localhost:27017"
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('siteData');

    const result = await collection.updateOne({ 'url': site }, { $set: data }, { upsert: true });
    console.log(`Document updated for ${site} with id: ${result.upsertedId}`);

  } catch (error) {
    console.error('Error occurred while sending data to MongoDB:', error);
  } finally {
    client.close();
  }
}

async function getHTMLDataFromMongoDB(Site) {

  const uri ="mongodb://localhost:27017"
  const client = new MongoClient(uri);

  try {

    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('siteData');
    const data = await collection.findOne({ 'url': Site });
    return data;

  } catch (error) {

    console.error('Error occurred while retrieving data from MongoDB:', error);

  } finally {

    client.close();

  }
}
module.exports = { getHTMLDataFromMongoDB, sendSiteHTMLDataToMongoDB, sendDataToMongoDB, getDataFromMongoDB, getDataFromMongoDBForBulkDomains }

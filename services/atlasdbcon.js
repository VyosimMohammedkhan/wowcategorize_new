//const { MongoClient } = require('mongodb');
// ``
// async function sendDataToMongoDB(data) {
//   const uri = 'mongodb://localhost:27017'; 
//   const dbName = 'wowcategorize'; 
//   const collectionName = 'categories'; 
//   const site = data.metaData.Site;
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();

//     const db = client.db(dbName);
//     const collection = db.collection(collectionName);

//     const existingData = await collection.findOne({'metaData.Site': site});

//     if (!existingData) {
//       // Insert the data into the collection
//       const result = await collection.insertOne(data);
//       console.log(`Successfully inserted document for ${site} with id ${result.insertedId}.`);
//     } else {
//       console.log(`Data already exists for ${site} with id ${existingData._id}. Skipping insertion.`);
//     }


//   } catch (error) {
//     console.error('Error occurred while sending data to MongoDB:', error);
//   } finally {

//     //client.close();  // calling from within the executor
//   }
// }


const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://vyosimmohammedk:Vyosim%402023@wowcategorize.opwfdbe.mongodb.net?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('wowcategorize');
    const collection = db.collection('categories');

    // Find the first document in the collection
    let dbData = await collection.findOne()
    delete dbData._id
    let keywords=await dbData.keywords
    console.log(keywords);

    const changeStream = collection.watch();

    changeStream.on('change', async (change) => {
      console.log('Change event received:');
      console.log(change);
      let dbData = await collection.findOne()
      delete dbData._id
      let keywords=await dbData.keywords
    });

  } finally {
    // Close the database connection when finished or an error occurs
    await client.close();
  }
}
run().catch(console.error);




// module.exports = {sendDataToMongoDB}

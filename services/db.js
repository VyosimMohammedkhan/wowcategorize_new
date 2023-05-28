// const { MongoClient } = require('mongodb');
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

// // async function getDataFromMongoDB() {
// //   const uri = 'mongodb://localhost:27017'; 
// //   const dbName = 'wowcategorize'; 
// //   const collectionName = 'categories'; 

// //   const client = new MongoClient(uri);

// //   try {
// //     await client.connect();

// //     const db = client.db(dbName);
// //     const collection = db.collection(collectionName);

// //     // Fetch data from the collection
// //     const data = await collection.find().toArray();

// //     console.log('Retrieved data:');
// //     console.log(data);

// //     return data;

// //   } catch (error) {
// //     console.error('Error occurred while retrieving data from MongoDB:', error);
// //   } finally {
// //     // Close the MongoDB connection
// //     client.close();
// //   }
// // }

// module.exports = {sendDataToMongoDB}

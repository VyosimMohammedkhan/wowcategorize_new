const express = require('express');
const router = express.Router();
const fs=require('fs')


const app = express();
app.use(express.json());

router.get('/', (req, res) => {
 console.log('reading file')
  fs.readFile('./services/keywords.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json(jsonData);
    console.log("json data sent successfully");
  });
})




router.post('/', (req, res) => {
  const updatedData = req.body;

  fs.writeFile('./services/keywords.json', JSON.stringify(updatedData), 'utf8', err => {
    if (err) {
      console.error('Error writing JSON file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    console.log('Data updated successfully');
    res.status(200).json({ message: 'Data updated successfully' });
  });
});
  module.exports = router;
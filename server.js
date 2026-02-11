require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

// creation du serveur web avec Express
const app = express();
app.use(express.json());

const dbUrl = process.env.MONGO_URI; 
const port = process.env.PORT

//connexion a la bdd trains
mongoose.connect(dbUrl)
  .then(() => console.log('Connexion to MongoDB initialize'))
  .catch((err) => console.log('Error while connecting to MongoDB', err));


app.get('/', (req, res) => {
  res.send('Node.js server work');
});

//lancement serveur sur le port 3000
app.listen(port, () => {
  console.log(`Server initialized on http://localhost:${port}`);
});
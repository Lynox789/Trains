require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');

// creation du serveur web avec Express
const app = express();
app.use(express.static('view'));
app.use('/css',express.static('css'));
app.use('/js', express.static('js'));
app.use('/img', express.static('img'))
app.use(express.json());

const dbUrl = process.env.MONGO_URI; 
const port = process.env.PORT

//connexion a la bdd trains
mongoose.connect(dbUrl)
  .then(() => console.log('Connexion to MongoDB initialize'))
  .catch((err) => console.log('Error while connecting to MongoDB', err));


app.get('/api/trajets', async (req, res) => {
  try{
    // trouver tous les trejets
    const trajets = await Trajet.find();

    res.json(trajets);
  }catch(err){
    res.status(500).json({message : "Erreur lors de la récupération des données", error:err});
  }
});

//lancement serveur sur le port 3000
app.listen(port, () => {
  console.log(`Server initialized on http://localhost:${port}`);
});
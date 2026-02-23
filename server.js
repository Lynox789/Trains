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
    const {date, gare_depart, gare_arrivee} = req.query; // on récupère la date passé dans l'URL
    let query = {};
    // trouver tous les trejets
    if(date && date !== 'undefined' && date !== '') {
      query.date_depart = date; // si une date est fournie, on filtre
    }
    if(gare_depart && gare_depart !== 'undefined' && gare_depart !== '') {
      query.gare_depart = {$regex: new RegExp(gare_depart, "i")};
    }
    if(gare_arrivee && gare_arrivee !== 'undefined' && gare_arrivee !== '') {
      query.gare_arrivee = {$regex: new RegExp(gare_arrivee, "i")};
    }

    const trajets = await Trajet.find(query);
    return res.json(trajets);
    
  }catch(err){
    res.status(500).json({message : "Erreur lors de la récupération des données", error:err});
  }
});

app.get('/api/calendrier-prix', async (req, res) => {
    try {

      const {gare_depart, gare_arrivee} = req.query;

      let query = {};

      if(gare_depart) {
        query.gare_depart = {$regex: new RegExp(gare_depart, "i")};
      }
      if(gare_arrivee) {
        query.gare_arrivee = {$regex: new RegExp(gare_arrivee, "i")};
      }

      const trajets = await Trajet.find(query);
      
      // Objet temporaire pour stocker le prix minimum par jour
      const mapPrix = {};

      trajets.forEach(t => {
          const d = t.date_depart; 
          if (d) {
              // Si la date n'existe pas encore ou si ce trajet est moins cher
              if (!mapPrix[d] || t.prix_base < mapPrix[d]) {
                  mapPrix[d] = t.prix_base;
              }
          }
      });

      // On transforme l'objet en tableau pour le JavaScript du navigateur
      const calendrier = Object.keys(mapPrix).map(date => ({
          date: date,
          prix: mapPrix[date]
      }));

      return res.json(calendrier);

    } catch (err) {
        return res.status(500).json({ message: "Erreur calendrier", error: err });
    }
});

app.get('/api/gares', async (req,res) => {
  try{
    const { q } = req.query; // q = ce que l'utilisateur tape 

    if(!q) return res.json([]);

    //On utilise .distinct() pour ne pas avoir 50 fois "Paris" si on a 50 trajets vers Paris
    const gares = await Trajet.find({
      gare_arrivee: {$regex: new RegExp(q, "i")}
    }).distinct('gare_arrivee');

    // limite à 5 resultat
    res.json(gares.slice(0,5));
  }catch(err){
    res.status(500).json({error: err.message});
  }
});

//lancement serveur sur le port 3000
app.listen(port, () => {
  console.log(`Server initialized on http://localhost:${port}`);
});
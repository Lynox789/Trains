require('dotenv').config();

// Importation des modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');
const { MailtrapClient} = require("mailtrap");
const User = require('./model/User');
const Billet = require('./model/Billet');

// creation du serveur web avec Express
const app = express();
app.use(express.static('view'));
app.use('/css',express.static('css'));
app.use('/js', express.static('js'));
app.use('/img', express.static('img'))
app.use(express.json());

const dbUrl = process.env.MONGO_URI; 
const port = process.env.PORT || 5000;

//connexion a la bdd trains
mongoose.connect(dbUrl)
  .then(() => console.log('Connexion to MongoDB initialize'))
  .catch((err) => console.log('Error while connecting to MongoDB', err));


// routes Authentification (Connexion / Inscription)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.json({ success: true, user: { id: user._id, nom_complet: user.nom_complet, role: user.role } });
        } else {
            res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { nom_complet, email, password } = req.body;
    try {
        const newUser = new User({ nom_complet, email, password, role: 'adherent' });
        await newUser.save();
        res.json({ success: true });
    } catch(err) {
        res.status(400).json({ success: false, message: 'Erreur lors de l\'inscription (Email peut-être déjà utilisé)' });
    }
});


// Routes adminisitration
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/trajets/:id', async (req, res) => {
    try {
        await Trajet.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});


// Routes trajets / recherche 

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

// Route envoi de billet (mailtrap)
app.post('/api/send-ticket', async (req, res) => {
    try {
        // On récupère aussi le userId maintenant
        const { userId, email, billet } = req.body; 
        const TOKEN = process.env.MAILTRAP_TOKEN; 

        // Sauvegarder le billet en base de données SI l'utilisateur est connecté
        if (userId) {
            const nouveauBillet = new Billet({
                user_id: userId,
                reference: billet.reference,
                depart: billet.depart,
                arrivee: billet.arrivee,
                date: billet.date,
                heure_depart: billet.heure_depart,
                prix_total: billet.prix_total
            });
            await nouveauBillet.save();
            console.log("Billet sauvegardé en BDD !");
        }

        // Initialisation du client Mailtrap
        const client = new MailtrapClient({ token: TOKEN, testInboxId: 4159625 });
        const sender = { email: "hello@example.com", name: "europe.transports" };

        // Envoi de l'email
        await client.testing.send({
            from: sender,
            to: [{ email: email }],
            subject: `Votre billet europe.transports - Réf: ${billet.reference}`,
            category: "Integration Test",
            html: `<div style="font-family: Arial; padding: 20px;">
                    <h2>Merci pour votre réservation !</h2>
                    <p>Réf: ${billet.reference} | ${billet.depart} ➔ ${billet.arrivee}</p>
                    <p>Date: ${billet.date} à ${billet.heure_depart}</p>
                    <p>Prix Total: ${billet.prix_total} €</p>
                   </div>`
        });

        res.status(200).json({ message: 'Billet acheté, sauvegardé et email envoyé !' });

    } catch (error) {
        console.error("Erreur lors de la commande :", error);
        res.status(500).json({ error: "Erreur lors de la commande" });
    }
});

app.get('/api/users/:userId/billets', async (req, res) => {
    try {
        // On cherche tous les billets liés à cet ID, triés du plus récent au plus ancien
        const billets = await Billet.find({ user_id: req.params.userId }).sort({ date_achat: -1 });
        res.json(billets);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});


//lancement serveur sur le port 3000
app.listen(port, () => {
  console.log(`Server initialized on http://localhost:${port}`);
});
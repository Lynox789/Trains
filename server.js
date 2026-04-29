require('dotenv').config();

// Importation des modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');
const User = require('./model/User');
const Reservation = require('./model/Reservation');

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
        const user = await User.findOne({ email });

        // Vérification avec bcrypt au lieu de comparer en clair
        if (!user || !(await user.verifierPassword(password))) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }

        res.json({ success: true, user: { id: user._id, nom_complet: user.nom_complet, role: user.role } });
    } catch (err) {
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

// Route envoi de billet (EmailJS)
app.post('/api/send-ticket', async (req, res) => {
    try {
        const { userId, email, billet } = req.body;
 
        // Sauvegarde en BDD avec le nouveau modèle Reservation
        if (userId) {
            const nouvelleReservation = new Reservation({
                num_reservation: billet.reference || billet.num_reservation,
                user_id: userId,
                usager: {
                    nom_complet: billet.nom_complet || '',
                    email:       email
                },
                trajet_reserve: {
                    type_trajet: billet.type_trajet || 'Aller',
                    billets:     billet.billets     || []
                },
                paiement: billet.paiement || {},
                prix_total: parseFloat(billet.prix_total) || 0
            });
            await nouvelleReservation.save();
            console.log('Réservation sauvegardée :', billet.reference);
        }
 
        // Préparation de la requête EmailJS
        const emailJsPayload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: req.body.email,
                reference: billet.reference || 'N/A',
                depart: billet.depart || 'N/A',
                arrivee: billet.arrivee || 'N/A',
                date: billet.date || 'N/A',
                heure_depart: billet.heure_depart || 'N/A',
                prix_total: parseFloat(billet.prix_total || 0).toFixed(2)
            }
        };
        console.log('Payload EmailJS:', JSON.stringify(emailJsPayload, null, 2));

        console.log('Envoi EmailJS...');
        console.log('Service:', process.env.EMAILJS_SERVICE_ID);
        console.log('Template:', process.env.EMAILJS_TEMPLATE_ID);
        console.log('Public Key:', process.env.EMAILJS_PUBLIC_KEY);

        // Envoi de la requête via fetch (natif dans les versions récentes de Node.js)
        const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailJsPayload)
        });

        console.log('Status EmailJS:', emailResponse.status);
        const responseText = await emailResponse.text();
        console.log('Réponse EmailJS:', responseText);
        
        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Erreur EmailJS: ${errorText}`);
        }
 
        res.status(200).json({ message: 'Réservation créée et mail envoyé via EmailJS.' });
 
    } catch (error) {
        console.error('Erreur /api/send-ticket :', error);
        res.status(500).json({ error: 'Erreur lors de la commande ou de l\'envoi du mail' });
    }
});
 

app.get('/api/users/:userId/reservations', async (req, res) => {
    try {
        const reservations = await Reservation
            .find({ user_id: req.params.userId })
            .sort({ date_achat: -1 });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Récupère les places occupées d'un train par voiture
app.get('/api/train/:id/places', async (req, res) => {
    try {
        const trajet = await Trajet.findById(req.params.id);
        if (!trajet) return res.status(404).json({ message: 'Train non trouvé' });

        // Si le train n'a pas encore de voitures, on les initialise
        if (!trajet.voitures || trajet.voitures.length === 0) {
            const voituresDefaut = [1, 2, 3].map(num => ({
                numero_voiture: num,
                total_places: 24,
                places: Array.from({ length: 24 }, (_, i) => ({
                    numero: i + 1,
                    statut: 'libre'
                }))
            }));
            trajet.voitures = voituresDefaut;
            await trajet.save();
        }

        res.json({ voitures: trajet.voitures });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Réserve les places choisies et met à jour le train
app.post('/api/train/:id/reserver-places', async (req, res) => {
    try {
        const { numero_voiture, places_choisies } = req.body;
        // places_choisies = [5, 6] par exemple

        const trajet = await Trajet.findById(req.params.id);
        if (!trajet) return res.status(404).json({ message: 'Train non trouvé' });

        const voiture = trajet.voitures.find(v => v.numero_voiture === numero_voiture);
        if (!voiture) return res.status(404).json({ message: 'Voiture non trouvée' });

        // Vérifier que les places sont encore libres
        for (const num of places_choisies) {
            const place = voiture.places.find(p => p.numero === num);
            if (!place || place.statut === 'occupee') {
                return res.status(409).json({ message: `Place ${num} déjà occupée` });
            }
        }

        // Marquer les places comme occupées
        for (const num of places_choisies) {
            const place = voiture.places.find(p => p.numero === num);
            place.statut = 'occupee';
        }

        // Mettre à jour places_restantes
        trajet.places_restantes = Math.max(0, (trajet.places_restantes || 0) - places_choisies.length);

        // Nécessaire pour que Mongoose détecte le changement dans le tableau imbriqué
        trajet.markModified('voitures');
        await trajet.save();

        res.json({ success: true, places_reservees: places_choisies });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//lancement serveur sur le port 5000
app.listen(port, () => {
  console.log(`Server initialized on http://localhost:${port}`);
});
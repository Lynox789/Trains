// 1. Chargement des variables d'environnement
require('dotenv').config();

// 2. Importation des modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const { MailtrapClient } = require("mailtrap"); 
const Trajet = require('./model/Trajet');
const User = require('./model/User'); // <-- AJOUT DU MODÈLE USER
const Billet = require('./model/Billet');
// 3. Création du serveur web avec Express
const app = express();
app.use(express.static('view'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/img', express.static('img'));
app.use(express.json());

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/test"; 
const port = process.env.PORT || 5000;

mongoose.connect(dbUrl)
  .then(() => console.log(`Connexion à MongoDB initialisée sur ${dbUrl}`))
  .catch((err) => console.log('Erreur de connexion à MongoDB', err));


// ==============================================================
// --- ROUTES AUTHENTIFICATION (Connexion / Inscription) ---
// ==============================================================
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


// ==============================================================
// --- ROUTES ADMINISTRATION (Gestion des membres et billets) ---
// ==============================================================
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


// ==============================================================
// --- ROUTES TRAJETS / RECHERCHE (Anciennes routes) ---
// ==============================================================
app.get('/api/trajets', async (req, res) => {
    try {
        // Remets ta logique de filtrage ici si tu en avais une (req.query.depart, req.query.arrivee, etc.)
        const trajets = await Trajet.find({});
        res.json(trajets);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des trajets" });
    }
});

app.get('/api/calendrier-prix', async (req, res) => { 
    /* Ton code existant pour le calendrier-prix */ 
    res.json({ message: "Route calendrier" });
});

app.get('/api/gares', async (req, res) => { 
    try {
        // Exemple simple pour renvoyer la liste des gares sans doublons
        const gares = await Trajet.distinct('gare_depart');
        res.json(gares);
    } catch (error) {
         res.status(500).json({ error: "Erreur lors de la récupération des gares" });
    }
});


// ==============================================================
// --- ROUTE ENVOI DE BILLET (MAILTRAP) ---
// ==============================================================
app.post('/api/send-ticket', async (req, res) => {
    try {
        // On récupère aussi le userId maintenant
        const { userId, email, billet } = req.body; 
        const TOKEN = process.env.MAILTRAP_TOKEN; 

        // 1. Sauvegarder le billet en base de données SI l'utilisateur est connecté
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

        // 2. Initialisation du client Mailtrap
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

// Lancement du serveur
app.listen(port, () => {
  console.log(`Serveur initialisé sur http://localhost:${port}`);
});
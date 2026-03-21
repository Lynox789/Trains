// 1. Chargement des variables d'environnement
require('dotenv').config();

// 2. Importation des modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const { MailtrapClient } = require("mailtrap"); // <-- CORRECTION ICI
const Trajet = require('./model/Trajet');

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


// --- Routes existantes (Trajets, Calendrier, Gares) ---
// ⚠️ N'oublie pas de remettre ton vrai code ici à la place des commentaires !
app.get('/api/trajets', async (req, res) => { /* Ton code existant... */ });
app.get('/api/calendrier-prix', async (req, res) => { /* Ton code existant... */ });
app.get('/api/gares', async (req, res) => { /* Ton code existant... */ });


// --- CORRECTION ICI : "app.post" au lieu de "/app.post" ---
app.post('/api/send-ticket', async (req, res) => {
    try {
        const { email, billet } = req.body; 
        const TOKEN = process.env.MAILTRAP_TOKEN; 

        // Initialisation du client Mailtrap pur (sans Nodemailer)
        const client = new MailtrapClient({ token: TOKEN, testInboxId: 4159625 });

        const sender = {
            email: "hello@example.com",
            name: "europe.transports (Test Mailtrap)",
        };

        // Envoi avec la méthode testing.send() de Mailtrap
        const info = await client.testing.send({
            from: sender,
            to: [{ email: email }],
            subject: `Votre billet europe.transports - Réf: ${billet.reference}`,
            category: "Integration Test",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
                    <h2 style="color: #3182CE; text-align: center;">Merci pour votre réservation !</h2>
                    <p>Voici les détails de votre voyage :</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p><strong>Référence :</strong> ${billet.reference}</p>
                        <p><strong>Trajet :</strong> ${billet.depart} ➔ ${billet.arrivee}</p>
                        <p><strong>Date :</strong> ${billet.date}</p>
                        <p><strong>Heure de départ :</strong> ${billet.heure_depart}</p>
                        <p><strong>Prix Total :</strong> ${billet.prix_total} €</p>
                    </div>
                </div>
            `
        });

        console.log("Email envoyé dans Mailtrap :", info);
        res.status(200).json({ message: 'Email de test envoyé avec succès via Mailtrap (sans Nodemailer)' });

    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email via Mailtrap :", error);
        res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
    }
});

app.listen(port, () => {
  console.log(`Serveur initialisé sur http://localhost:${port}`);
});
require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet'); // On importe le modèle créé juste avant

const dbUrl = process.env.MONGO_URI;

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('Connexion réussie pour le remplissage...');

        // On vide la collection actuelle pour repartir de zéro
        await Trajet.deleteMany({});

        // On crée les données
        const trajetsExemples = [
            {
                gare_depart: "Paris Gare de Lyon",
                gare_arrivee: "Lyon Part-Dieu",
                heure_depart: "08:00",
                heure_arrivee: "10:00",
                prix_base: 45
            },
            {
                gare_depart: "Lyon Part-Dieu",
                gare_arrivee: "Paris Gare de Lyon",
                heure_depart: "10:00",
                heure_arrivee: "12:00",
                prix_base: 49
            },
            {
                gare_depart: "Paris Saint-Lazare",
                gare_arrivee: "La Cour À Quatre",
                heure_depart: "14:40",
                heure_arrivee: "18:36",
                prix_base: 45, // Prix de base calendaire [cite: 112]
                escales: [
                    { type: 'gare', gare: "Paris Saint-Lazare", heure: "14:40", info: "Train TER N°3117 - Vers Le Havre" },
                    { type: 'gare', gare: "Bréauté - Beuzeville", heure: "16:33", info: "Arrivée pour correspondance" },
                    { type: 'attente', duree_segment: "23 min" }, // Le segment entre les deux points
                    { type: 'gare', gare: "Bréauté - Beuzeville", heure: "16:56", info: "Train TER N°850340 - Vers Fécamp" },
                    { type: 'gare', gare: "La Cour À Quatre", heure: "18:36", info: "Arrivée à destination" }
                ]
            }
        ];

        await Trajet.insertMany(trajetsExemples);
        console.log('La base de données a été initialisée avec succès !');
        process.exit(); // On ferme le script
    })
    .catch(err => console.log('Erreur :', err));
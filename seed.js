require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet'); // On importe le modèle

const trajetsExemples = [
    // MERCREDI 11 FÉVRIER (Prix de base)
    {
        gare_depart: "Paris Saint-Lazare",
        gare_arrivee: "La Cour À Quatre",
        date_depart: "Mer. 11 fév.",
        heure_depart: "14:40",
        heure_arrivee: "18:36",
        prix_base: 45,
        escales: [
            { type: 'gare', gare: "Paris Saint-Lazare", heure: "14:40", info: "Train TER N°3117" },
            { type: 'gare', gare: "Bréauté - Beuzeville", heure: "16:33", info: "Arrivée correspondance" },
            { type: 'attente', gare: "Bréauté - Beuzeville", duree_segment: "23 min" },
            { type: 'gare', gare: "Bréauté - Beuzeville", heure: "16:56", info: "Départ vers Fécamp" },
            { type: 'gare', gare: "La Cour À Quatre", heure: "18:36", info: "Arrivée à destination" }
        ]
    },
    // JEUDI 12 FÉVRIER (Le moins cher - US 1.2)
    {
        gare_depart: "Paris Saint-Lazare",
        gare_arrivee: "La Cour À Quatre",
        date_depart: "Jeu. 12 fév.",
        heure_depart: "08:15",
        heure_arrivee: "11:20",
        prix_base: 29,
        escales: []
    },
    // VENDREDI 13 FÉVRIER (Plus cher)
    {
        gare_depart: "Paris Saint-Lazare",
        gare_arrivee: "La Cour À Quatre",
        date_depart: "Ven. 13 fév.",
        heure_depart: "17:30",
        heure_arrivee: "21:15",
        prix_base: 55,
        escales: [
            { type: 'gare', gare: "Paris Saint-Lazare", heure: "17:30", info: "Train TER N°3150" },
            { type: 'gare', gare: "Rouen Rive Droite", heure: "18:45", info: "Arrêt en gare" }, 
            { type: 'attente', gare: "Rouen Rive Droite", duree_segment: "15 min" },
            { type: 'gare', gare: "Rouen Rive Droite", heure: "19:00", info: "Départ de Rouen Rive Droite" }, 
            { type: 'gare', gare: "La Cour À Quatre", heure: "21:15", info: "Arrivée" }
    ]
    },
    // SAMEDI 14 FÉVRIER
    {
        gare_depart: "Paris Saint-Lazare",
        gare_arrivee: "La Cour À Quatre",
        date_depart: "Sam. 14 fév.",
        heure_depart: "10:00",
        heure_arrivee: "13:45",
        prix_base: 42,
        escales: []
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connexion BDD réussie pour le seeding");

        // Nettoyage de la collection existante
        await Trajet.deleteMany({});
        console.log("Collection Trajets vidée");

        // Insertion des nouveaux trajets
        await Trajet.insertMany(trajetsExemples);
        console.log(`${trajetsExemples.length} trajets insérés avec succès !`);

        mongoose.connection.close();
        console.log("Connexion fermée");
    } catch (error) {
        console.error("Erreur lors du seeding :", error);
        process.exit(1);
    }
};

seedDB();
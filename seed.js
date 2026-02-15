require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');

const dbUrl = process.env.MONGO_URI;


const trajetsManuels = [
    // Mercredi 11 : Le trajet avec escales complexes
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
    // Jeudi 12 : Le trajet pas cher
    {
        gare_depart: "Paris Saint-Lazare",
        gare_arrivee: "La Cour À Quatre",
        date_depart: "Jeu. 12 fév.",
        heure_depart: "08:15",
        heure_arrivee: "11:20",
        prix_base: 29,
        escales: []
    }
];


// Les dates sur lesquelles on veut des trains
const dates = [
    "Mer. 11 fév.", 
    "Jeu. 12 fév.", 
    "Ven. 13 fév.", 
    "Sam. 14 fév.", 
    "Dim. 15 fév."
];

// Les grandes lignes (Départ <-> Arrivée)
// On définit une durée approximative pour calculer l'heure d'arrivée
const lignes = [
    { dep: "Paris Gare de Lyon", arr: "Lyon Part-Dieu", duree: 2, prixMin: 40, prixMax: 90 },
    { dep: "Paris Montparnasse", arr: "Bordeaux Saint-Jean", duree: 2.5, prixMin: 50, prixMax: 110 },
    { dep: "Paris Gare du Nord", arr: "Lille Europe", duree: 1, prixMin: 25, prixMax: 60 },
    { dep: "Lyon Part-Dieu", arr: "Marseille Saint-Charles", duree: 1.5, prixMin: 30, prixMax: 70 },
    { dep: "Paris Montparnasse", arr: "Nantes", duree: 2, prixMin: 45, prixMax: 85 }
];

// Petite fonction pour ajouter des heures (ex: 14h + 2h = 16h)
function calculerArrivee(heureDepart, dureeTrajet) {
    let [h, m] = heureDepart.split(':').map(Number);
    
    // On ajoute la durée + un peu d'aléatoire (0 à 15 min) pour le réalisme
    let ajoutMinutes = (dureeTrajet * 60) + Math.floor(Math.random() * 15);
    
    let totalMinutes = (h * 60) + m + ajoutMinutes;
    
    let hArr = Math.floor(totalMinutes / 60) % 24;
    let mArr = Math.floor(totalMinutes % 60);

    return `${hArr.toString().padStart(2, '0')}:${mArr.toString().padStart(2, '0')}`;
}

// Fonction prix aléatoire
function genererPrix(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function genererAutreTrajets() {
    let resultats = [];

    dates.forEach(date => {
        lignes.forEach(ligne => {
            
            // --- SCENARIO 1 : SENS ALLER (Matin) ---
            resultats.push({
                gare_depart: ligne.dep,
                gare_arrivee: ligne.arr,
                date_depart: date,
                heure_depart: "07:30",
                heure_arrivee: calculerArrivee("07:30", ligne.duree),
                prix_base: genererPrix(ligne.prixMin, ligne.prixMax),
                escales: []
            });

            // --- SCENARIO 2 : SENS ALLER (Soir) ---
            resultats.push({
                gare_depart: ligne.dep,
                gare_arrivee: ligne.arr,
                date_depart: date,
                heure_depart: "18:15",
                heure_arrivee: calculerArrivee("18:15", ligne.duree),
                prix_base: genererPrix(ligne.prixMin + 15, ligne.prixMax + 20), // Plus cher le soir
                escales: []
            });

            // --- SCENARIO 3 : SENS RETOUR (Midi) ---
            // Important pour tester l'Aller-Retour !
            resultats.push({
                gare_depart: ligne.arr, // On inverse
                gare_arrivee: ligne.dep,
                date_depart: date,
                heure_depart: "12:45",
                heure_arrivee: calculerArrivee("12:45", ligne.duree),
                prix_base: genererPrix(ligne.prixMin, ligne.prixMax),
                escales: []
            });
             // --- SCENARIO 4 : SENS RETOUR (Soir) ---
             resultats.push({
                gare_depart: ligne.arr, 
                gare_arrivee: ligne.dep,
                date_depart: date,
                heure_depart: "19:30",
                heure_arrivee: calculerArrivee("19:30", ligne.duree),
                prix_base: genererPrix(ligne.prixMin, ligne.prixMax),
                escales: []
            });
        });
    });

    return resultats;
}


const trajetsGeneres = genererAutreTrajets();
const seedFinal = [...trajetsManuels, ...trajetsGeneres];

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('--- DÉBUT DU SEED ---');
        console.log('Connexion MongoDB établie.');
        
        // 1. Nettoyage
        await Trajet.deleteMany({});
        console.log('Ancienne base de données effacée.');

        // 2. Insertion
        await Trajet.insertMany(seedFinal);
        
        console.log(`\nSUCCÈS ! ${seedFinal.length} trajets ont été créés.`);
        console.log("------------------------------------------------");
        console.log("Détails :");
        console.log(`- ${trajetsManuels.length} trajets manuels (La Cour À Quatre)`);
        console.log(`- ${trajetsGeneres.length} trajets générés (Paris, Lyon, Marseille...)`);
        console.log("------------------------------------------------");
        
        mongoose.disconnect();
        console.log('Connexion fermée.');
    })
    .catch(err => {
        console.error("ERREUR lors du seed :", err);
        mongoose.disconnect();
    });
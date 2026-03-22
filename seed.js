require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');
const User = require('./model/User'); // <-- AJOUT

const dbUrl = process.env.MONGO_URI;

// COMPTES PAR DÉFAUT
const usersInitiaux = [
    { nom_complet: "Admin Principal", email: "admin@trains.fr", password: "admin", role: "admin" },
    { nom_complet: "Jean Adhérent", email: "jean@trains.fr", password: "password", role: "adherent" }
];
// LES TRAJETS MANUELS
const trajetsManuels = [
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

// GÉNÉRATION DYNAMIQUE DES DATES

// Fonction qui génère automatiquement les X prochains jours au format exact de la BDD
function genererDates(nombreDeJours) {
    const datesGenerees = [];
    // On commence au 11 février 2026 (Mois '1' car Janvier = 0 )
    let dateDeBase = new Date(2026, 1, 11); 

    for (let i = 0; i < nombreDeJours; i++) {
        const dateCourante = new Date(dateDeBase);
        dateCourante.setDate(dateDeBase.getDate() + i);

        // Formatage identique au frontend
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        let dateFormatee = dateCourante.toLocaleDateString('fr-FR', options);
        dateFormatee = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
        dateFormatee = dateFormatee.replace('févr', 'fév').replace('janv', 'janv').replace('juil', 'juil');
        
        datesGenerees.push(dateFormatee);
    }
    return datesGenerees;
}

// CHOISIR LE NOMBRE DE JOURS (Ex: 30 jours, soit 1 mois de trajets)
const dates = genererDates(30); 


// LES GRANDES LIGNES
const lignes = [
    { dep: "Paris Gare de Lyon", arr: "Lyon Part-Dieu", duree: 2, prixMin: 40, prixMax: 90 },
    { dep: "Paris Montparnasse", arr: "Bordeaux Saint-Jean", duree: 2.5, prixMin: 50, prixMax: 110 },
    { dep: "Paris Gare du Nord", arr: "Lille Europe", duree: 1, prixMin: 25, prixMax: 60 },
    { dep: "Lyon Part-Dieu", arr: "Marseille Saint-Charles", duree: 1.5, prixMin: 30, prixMax: 70 },
    { dep: "Paris Montparnasse", arr: "Nantes", duree: 2, prixMin: 45, prixMax: 85 }
];

function calculerArrivee(heureDepart, dureeTrajet) {
    let [h, m] = heureDepart.split(':').map(Number);
    let ajoutMinutes = (dureeTrajet * 60) + Math.floor(Math.random() * 15);
    let totalMinutes = (h * 60) + m + ajoutMinutes;
    let hArr = Math.floor(totalMinutes / 60) % 24;
    let mArr = Math.floor(totalMinutes % 60);
    return `${hArr.toString().padStart(2, '0')}:${mArr.toString().padStart(2, '0')}`;
}

function genererPrix(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 4. BOUCLE DE GÉNÉRATION
function genererAutreTrajets() {
    let resultats = [];

    dates.forEach(date => {
        lignes.forEach(ligne => {
            // SENS ALLER (Matin)
            resultats.push({
                gare_depart: ligne.dep,
                gare_arrivee: ligne.arr,
                date_depart: date,
                heure_depart: "07:30",
                heure_arrivee: calculerArrivee("07:30", ligne.duree),
                prix_base: genererPrix(ligne.prixMin, ligne.prixMax),
                escales: []
            });

            // SENS ALLER (Soir)
            resultats.push({
                gare_depart: ligne.dep,
                gare_arrivee: ligne.arr,
                date_depart: date,
                heure_depart: "18:15",
                heure_arrivee: calculerArrivee("18:15", ligne.duree),
                prix_base: genererPrix(ligne.prixMin + 15, ligne.prixMax + 20),
                escales: []
            });

            // SENS RETOUR (Midi)
            resultats.push({
                gare_depart: ligne.arr, 
                gare_arrivee: ligne.dep,
                date_depart: date,
                heure_depart: "12:45",
                heure_arrivee: calculerArrivee("12:45", ligne.duree),
                prix_base: genererPrix(ligne.prixMin, ligne.prixMax),
                escales: []
            });

             // SENS RETOUR (Soir)
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

// 5. INSERTION EN BDD
const trajetsGeneres = genererAutreTrajets();
const seedFinal = [...trajetsManuels, ...trajetsGeneres];

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('--- DÉBUT DU SEED ---');
        console.log('Connexion MongoDB établie.');
        
        await Trajet.deleteMany({});
        console.log('Ancienne base de données effacée.');

        await Trajet.insertMany(seedFinal);
        
        console.log(`\nSUCCÈS ! ${seedFinal.length} trajets ont été créés.`);
        console.log("------------------------------------------------");
        console.log("Détails :");
        console.log(`- ${trajetsManuels.length} trajets manuels (La Cour À Quatre)`);
        console.log(`- ${trajetsGeneres.length} trajets générés sur ${dates.length} jours consécutifs.`);
        console.log("------------------------------------------------");
        
        mongoose.disconnect();
        console.log('Connexion fermée.');
    })
    .catch(err => {
        console.error("ERREUR lors du seed :", err);
        mongoose.disconnect();
    });
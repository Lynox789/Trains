require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet');
const User = require('./model/User');
const Reservation = require('./model/Reservation');

const dbUrl = process.env.MONGO_URI;

// ══════════════════════════════════════════
//  COMPTES PAR DÉFAUT
// ══════════════════════════════════════════
const bcrypt = require('bcrypt');

// Remplace usersInitiaux par une fonction async
async function creerUsers() {
    const users = [
        { nom_complet: "Admin Principal", email: "admin@trains.fr",  password: await bcrypt.hash("admin",    12), role: "admin"    },
        { nom_complet: "Jean Adhérent",   email: "jean@trains.fr",   password: await bcrypt.hash("password", 12), role: "adherent" }
    ];
    
    const nbUsers = await User.countDocuments();
    if (nbUsers === 0) {
        await User.insertMany(users);
        console.log(`${users.length} utilisateurs créés avec passwords hashés.`);
    } else {
        console.log(`Users déjà présents (${nbUsers}), non écrasés.`);
    }
}

// ══════════════════════════════════════════
//  GÉNÉRATION DES VOITURES AVEC PLACES
//  nb_voitures  : nombre de voitures du train
//  places_total : places par voiture
//  taux_occupation : entre 0 et 1 (ex: 0.3 = 30% de places déjà prises)
// ══════════════════════════════════════════
function genererVoitures(nb_voitures = 3, places_total = 24, taux_occupation = 0.3) {
    const voitures = [];

    for (let v = 1; v <= nb_voitures; v++) {
        const places = [];
        const nbOccupees = Math.floor(places_total * taux_occupation);

        // Générer des numéros de places occupées aléatoirement
        const indices = Array.from({ length: places_total }, (_, i) => i + 1);
        const occupees = new Set();
        while (occupees.size < nbOccupees) {
            const idx = Math.floor(Math.random() * indices.length);
            occupees.add(indices[idx]);
        }

        for (let p = 1; p <= places_total; p++) {
            places.push({
                numero: p,
                statut: occupees.has(p) ? 'occupee' : 'libre'
            });
        }

        voitures.push({
            numero_voiture: v,
            total_places:   places_total,
            places
        });
    }

    return voitures;
}

// ══════════════════════════════════════════
//  TRAJETS MANUELS
// ══════════════════════════════════════════
const trajetsManuels = [
    {
        gare_depart:   "Paris Saint-Lazare",
        gare_arrivee:  "La Cour À Quatre",
        date_depart:   "Mer. 11 fév.",
        heure_depart:  "14:40",
        heure_arrivee: "18:36",
        prix_base:     45,
        places_restantes: 51,
        voitures: genererVoitures(3, 24, 0.3),
        escales: [
            { type: 'gare',    gare: "Paris Saint-Lazare",   heure: "14:40", info: "Train TER N°3117"         },
            { type: 'gare',    gare: "Bréauté - Beuzeville", heure: "16:33", info: "Arrivée correspondance"   },
            { type: 'attente', gare: "Bréauté - Beuzeville", duree_segment: "23 min"                          },
            { type: 'gare',    gare: "Bréauté - Beuzeville", heure: "16:56", info: "Départ vers Fécamp"       },
            { type: 'gare',    gare: "La Cour À Quatre",     heure: "18:36", info: "Arrivée à destination"    }
        ]
    },
    {
        gare_depart:   "Paris Saint-Lazare",
        gare_arrivee:  "La Cour À Quatre",
        date_depart:   "Jeu. 12 fév.",
        heure_depart:  "08:15",
        heure_arrivee: "11:20",
        prix_base:     29,
        places_restantes: 60,
        voitures: genererVoitures(3, 24, 0.2),
        escales: []
    }
];

// ══════════════════════════════════════════
//  GÉNÉRATION DYNAMIQUE DES DATES
// ══════════════════════════════════════════
function genererDates(nombreDeJours) {
    const datesGenerees = [];
    let dateDeBase = new Date(2026, 1, 11); // 11 février 2026

    for (let i = 0; i < nombreDeJours; i++) {
        const dateCourante = new Date(dateDeBase);
        dateCourante.setDate(dateDeBase.getDate() + i);

        let dateFormatee = dateCourante.toLocaleDateString('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
        dateFormatee = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
        dateFormatee = dateFormatee
            .replace('févr', 'fév')
            .replace('janv', 'janv')
            .replace('juil', 'juil');

        datesGenerees.push(dateFormatee);
    }
    return datesGenerees;
}

const dates = genererDates(100);

// ══════════════════════════════════════════
//  GRANDES LIGNES
// ══════════════════════════════════════════
const lignes = [
    { dep: "Paris Gare de Lyon",    arr: "Lyon Part-Dieu",         duree: 2,   prixMin: 40, prixMax: 90  },
    { dep: "Paris Montparnasse",    arr: "Bordeaux Saint-Jean",    duree: 2.5, prixMin: 50, prixMax: 110 },
    { dep: "Paris Gare du Nord",    arr: "Lille Europe",           duree: 1,   prixMin: 25, prixMax: 60  },
    { dep: "Lyon Part-Dieu",        arr: "Marseille Saint-Charles",duree: 1.5, prixMin: 30, prixMax: 70  },
    { dep: "Paris Montparnasse",    arr: "Nantes",                 duree: 2,   prixMin: 45, prixMax: 85  }
];

function calculerArrivee(heureDepart, dureeTrajet) {
    let [h, m] = heureDepart.split(':').map(Number);
    let totalMinutes = (h * 60) + m + (dureeTrajet * 60) + Math.floor(Math.random() * 15);
    let hArr = Math.floor(totalMinutes / 60) % 24;
    let mArr = Math.floor(totalMinutes % 60);
    return `${hArr.toString().padStart(2, '0')}:${mArr.toString().padStart(2, '0')}`;
}

function genererPrix(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ══════════════════════════════════════════
//  BOUCLE DE GÉNÉRATION
// ══════════════════════════════════════════
function genererAutreTrajets() {
    const resultats = [];

    dates.forEach(date => {
        lignes.forEach(ligne => {

            // Aller matin
            const prixAllerMatin = genererPrix(ligne.prixMin, ligne.prixMax);
            resultats.push({
                gare_depart:      ligne.dep,
                gare_arrivee:     ligne.arr,
                date_depart:      date,
                heure_depart:     "07:30",
                heure_arrivee:    calculerArrivee("07:30", ligne.duree),
                prix_base:        prixAllerMatin,
                places_restantes: Math.floor(Math.random() * 80) + 20,
                voitures:         genererVoitures(3, 24, Math.random() * 0.5),
                escales:          []
            });

            // Aller soir
            const prixAllerSoir = genererPrix(ligne.prixMin + 15, ligne.prixMax + 20);
            resultats.push({
                gare_depart:      ligne.dep,
                gare_arrivee:     ligne.arr,
                date_depart:      date,
                heure_depart:     "18:15",
                heure_arrivee:    calculerArrivee("18:15", ligne.duree),
                prix_base:        prixAllerSoir,
                places_restantes: Math.floor(Math.random() * 80) + 20,
                voitures:         genererVoitures(3, 24, Math.random() * 0.6),
                escales:          []
            });

            // Retour midi
            const prixRetourMidi = genererPrix(ligne.prixMin, ligne.prixMax);
            resultats.push({
                gare_depart:      ligne.arr,
                gare_arrivee:     ligne.dep,
                date_depart:      date,
                heure_depart:     "12:45",
                heure_arrivee:    calculerArrivee("12:45", ligne.duree),
                prix_base:        prixRetourMidi,
                places_restantes: Math.floor(Math.random() * 80) + 20,
                voitures:         genererVoitures(3, 24, Math.random() * 0.5),
                escales:          []
            });

            // Retour soir
            const prixRetourSoir = genererPrix(ligne.prixMin, ligne.prixMax);
            resultats.push({
                gare_depart:      ligne.arr,
                gare_arrivee:     ligne.dep,
                date_depart:      date,
                heure_depart:     "19:30",
                heure_arrivee:    calculerArrivee("19:30", ligne.duree),
                prix_base:        prixRetourSoir,
                places_restantes: Math.floor(Math.random() * 80) + 20,
                voitures:         genererVoitures(3, 24, Math.random() * 0.4),
                escales:          []
            });
        });
    });

    return resultats;
}

// ══════════════════════════════════════════
//  INSERTION EN BDD
// ══════════════════════════════════════════
const trajetsGeneres = genererAutreTrajets();
const seedFinal = [...trajetsManuels, ...trajetsGeneres];

mongoose.connect(dbUrl)
    .then(async () => {
        console.log('--- DÉBUT DU SEED ---');
        console.log('Connexion MongoDB établie.');

        // Trajets
        await Trajet.deleteMany({});
        await Reservation.deleteMany({});
        await User.deleteMany({});
        console.log('Ancienne collection Trajet effacée.');
        await Trajet.insertMany(seedFinal);
        console.log(`${seedFinal.length} trajets insérés.`);

        await creerUsers();


        console.log("\n------------------------------------------------");
        console.log("SUCCÈS !");
        console.log(`- ${trajetsManuels.length} trajets manuels`);
        console.log(`- ${trajetsGeneres.length} trajets générés sur ${dates.length} jours`);
        console.log(`- Chaque trajet contient 3 voitures de 24 places`);
        console.log("------------------------------------------------");

        mongoose.disconnect();
        console.log('Connexion fermée.');
    })
    .catch(err => {
        console.error("ERREUR lors du seed :", err);
        mongoose.disconnect();
    });
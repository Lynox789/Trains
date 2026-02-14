require('dotenv').config();
const mongoose = require('mongoose');
const Trajet = require('./model/Trajet'); 

const dbUrl = process.env.MONGO_URI;

// Les données de base pour mélanger
const gares = [
    "Paris Gare de Lyon", 
    "Paris Montparnasse", 
    "Paris Gare du Nord",
    "Lyon Part-Dieu", 
    "Marseille Saint-Charles", 
    "Bordeaux Saint-Jean", 
    "Lille Europe", 
    "Strasbourg", 
    "Nantes", 
    "Rennes"
];

// Pour matcher ton format exact "Jeu. 12 fév."
const jours = [
    "Lun. 09 fév.",
    "Mar. 10 fév.",
    "Mer. 11 fév.",
    "Jeu. 12 fév.",
    "Ven. 13 fév.",
    "Sam. 14 fév.",
    "Dim. 15 fév."
];

// Fonctions utilitaires pour générer de l'aléatoire
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatHeure(h, m) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function genererTrajets() {
    let trajets = [];

    // On garde tes exemples manuels spécifiques 
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
    trajets.push(...trajetsManuels);

    // GÉNÉRATION AUTOMATIQUE MASSIVE
    jours.forEach(jour => {
        gares.forEach(depart => {
            gares.forEach(arrivee => {
                // On ne crée pas de trajet Paris -> Paris
                if (depart === arrivee) return; 
                // On évite de relier deux gares parisiennes entre elles
                if (depart.includes('Paris') && arrivee.includes('Paris')) return;

                // On génère 3 trains par jour pour chaque liaison
                for (let i = 0; i < 3; i++) {
                    const heureDep = getRandomInt(6, 20); // Entre 6h et 20h
                    const minDep = getRandomInt(0, 59);
                    
                    const dureeHeures = getRandomInt(1, 4); // Trajet entre 1h et 4h
                    const dureeMinutes = getRandomInt(0, 59);

                    // Calcul arrivée (simplifié, ne gère pas le passage minuit parfait mais suffisant pour la demo)
                    let heureArr = heureDep + dureeHeures;
                    let minArr = minDep + dureeMinutes;
                    if(minArr >= 60) {
                        heureArr++;
                        minArr -= 60;
                    }

                    // 1 chance sur 3 d'avoir une escale
                    let escales = [];
                    if (Math.random() > 0.7) {
                        escales = [
                            { type: 'gare', gare: depart, heure: formatHeure(heureDep, minDep), info: "TGV INOUI" },
                            { type: 'attente', duree_segment: "Correspondance 45 min" },
                            { type: 'gare', gare: arrivee, heure: formatHeure(heureArr, minArr), info: "Arrivée" }
                        ];
                    }

                    trajets.push({
                        gare_depart: depart,
                        gare_arrivee: arrivee,
                        date_depart: jour,
                        heure_depart: formatHeure(heureDep, minDep),
                        heure_arrivee: formatHeure(heureArr, minArr),
                        prix_base: getRandomInt(25, 180), // Prix entre 25€ et 180€
                        escales: escales
                    });
                }
            });
        });
    });

    return trajets;
}

// Connexion et Insertion
mongoose.connect(dbUrl)
    .then(async () => {
        console.log('Connexion MongoDB réussie pour le Seed');
        
        // On vide la base pour éviter les doublons
        await Trajet.deleteMany({});
        console.log('Anciens trajets supprimés.');

        // On génère les données
        const data = genererTrajets();
        console.log(`Génération de ${data.length} trajets...`);

        // On insère tout d'un coup
        await Trajet.insertMany(data);
        console.log('Base de données peuplée avec succès !');

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        mongoose.disconnect();
    });
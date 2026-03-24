const mongoose = require('mongoose');


const PlaceSchema = new mongoose.Schema({
    numero:  { type: Number, required: true },
    statut:  { type: String, enum: ['libre', 'occupee'], default: 'libre' }
}, { _id: false });

const VoitureSchema = new mongoose.Schema({
    numero_voiture: { type: Number, required: true },
    total_places:   { type: Number, default: 24 },
    places:         { type: [PlaceSchema], default: [] }
}, { _id: false });

// On définit les champs attendus
const trajetSchema = new mongoose.Schema({
    date_depart: {type: String, require: true},
    gare_depart: { type: String, required: true }, 
    gare_arrivee: { type: String, required: true }, 
    heure_depart: { type: String, required: true }, 
    heure_arrivee: { type: String, required: true }, 
    prix_base: { type: Number, required: true },
    places_restantes: { type: Number, default: 142 },
    numero_train:     { type: String },
    escales: [
        {   
            type: {type:String}, // gare ou attente
            gare: String,
            heure: String,
            info: String, // ex: attente de 23min 
            duree_segment:String
        }
    ],
    // gestion des places par voiture 
    voitures: { type: [VoitureSchema], default: [] }     
});



module.exports = mongoose.model('Trajet', trajetSchema);
const mongoose = require('mongoose');

// On définit les champs attendus
const trajetSchema = new mongoose.Schema({
    gare_depart: { type: String, required: true }, 
    gare_arrivee: { type: String, required: true }, 
    heure_depart: { type: String, required: true }, 
    heure_arrivee: { type: String, required: true }, 
    prix_base: { type: Number, required: true },
    escales: [
        {   
            type: {type:String}, // gare ou attente
            gare: String,
            heure: String,
            info: String, // ex: attente de 23min 
            duree_segment:String
        }
    ]     
});

module.exports = mongoose.model('Trajet', trajetSchema);
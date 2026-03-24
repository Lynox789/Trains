const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
    nom_option:  { type: String },
    prix_option: { type: Number }
}, { _id: false });

const BilletSchema = new mongoose.Schema({
    num_billet:        { type: String },
    ref_train_id:      { type: String },
    gare_depart:       { type: String },
    gare_arrivee:      { type: String },
    date_heure_depart: { type: String },
    date_heure_arrivee:{ type: String },
    prix_base:         { type: Number },
    voiture:           { type: Number },
    places_choisies:   { type: [Number], default: [] },
    options_choisies:  { type: [OptionSchema], default: [] }
}, { _id: false });

const ReservationSchema = new mongoose.Schema({
    num_reservation: { type: String, required: true, unique: true },
    user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    usager: {
        nom_complet: { type: String },
        email:       { type: String },
        tel:         { type: String }
    },
    trajet_reserve: {
        type_trajet: { type: String, enum: ['Aller', 'Aller-Retour'], default: 'Aller' },
        billets:     { type: [BilletSchema], default: [] }
    },
    paiement: {
        nom_titulaire:      { type: String },
        numero_cb_masque:   { type: String },
        num_autorisation:   { type: String },
        date_paiement:      { type: Date }
    },
    prix_total:   { type: Number, required: true },
    date_achat:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
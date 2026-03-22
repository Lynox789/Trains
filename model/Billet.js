const mongoose = require('mongoose');

const billetSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, required: true },
    depart: { type: String, required: true },
    arrivee: { type: String, required: true },
    date: { type: String, required: true },
    heure_depart: { type: String, required: true },
    prix_total: { type: Number, required: true },
    date_achat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Billet', billetSchema);
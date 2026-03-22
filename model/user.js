const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom_complet: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['adherent', 'admin'], default: 'adherent' }
});

module.exports = mongoose.model('User', userSchema);
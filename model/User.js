const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const UserSchema = new mongoose.Schema({
    nom_complet: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['adherent', 'admin'], default: 'adherent' }
});

// Hash automatique avant chaque save()
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Méthode pour vérifier le mot de passe
UserSchema.methods.verifierPassword = function(passwordBrut) {
    return bcrypt.compare(passwordBrut, this.password);
};

module.exports = mongoose.model('User', UserSchema);
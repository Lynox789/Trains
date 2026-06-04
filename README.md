# 🚄 Train For Tran - Plateforme de Réservation TGV

Bienvenue sur le dépôt du projet **Train For Tran**, la nouvelle plateforme moderne de réservation de billets de TGV en ligne. Ce site permet aux utilisateurs de rechercher des trajets, d'ajouter des options personnalisées, de gérer leur panier et de recevoir leurs billets électroniques de manière sécurisée.

---

## 📋 Prérequis

Avant de pouvoir lancer le projet localement, assurez-vous d'avoir installé les outils suivants sur votre machine :

- **Node.js** (version 14 ou supérieure)
- **npm** (généralement installé avec Node.js) ou **Yarn**
- **MongoDB** (en local ou un cluster distant via MongoDB Atlas)
- Un compte **EmailJS** (pour la fonctionnalité d'envoi de billets par email)

---

## ⚙️ Installation et Configuration

### 1. Cloner le dépôt

Récupérez le code source sur votre machine locale :

```bash
git clone https://github.com/Lynox789/Trains.git
```

### 2. Installer les dépendances

Installez tous les paquets nécessaires au fonctionnement du backend et du frontend :

```bash
npm install
```

### 3. Configurer les variables d'environnement

Le projet utilise des variables d'environnement pour sécuriser les données sensibles. Créez un fichier nommé exactement `.env` à la racine de votre projet et copiez-y le contenu suivant en remplaçant les valeurs par vos propres identifiants :

```env
# Configuration de la base de données
MONGO_URI=

# Port d'écoute du serveur (par défaut 3000)
PORT=5000

# Configuration EmailJS (pour l'édition et l'envoi des billets)
EMAILJS_SERVICE_ID=votre_service_id
EMAILJS_TEMPLATE_ID=votre_template_id
EMAILJS_PUBLIC_KEY=votre_public_key
EMAILJS_PRIVATE_KEY=votre_private_key
```


### 4. Initialiser la base de données (Seeding)

Avant de lancer le serveur pour la première fois, vous devez peupler votre base de données MongoDB avec les données initiales (les trajets, les gares, etc.). Exécutez le script suivant :

```bash
node seed.js
```

> Un message de confirmation devrait apparaître dans la console une fois les trajets créés avec succès.

---

## 🚀 Lancement du site

Une fois l'installation, la configuration et l'initialisation terminées, vous pouvez démarrer le serveur :

```bash
node server.js
```

Le site sera alors accessible depuis votre navigateur à l'adresse suivante :

👉 [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html) *(ou le port que vous avez défini dans le fichier `.env`)*

---

## 🛠️ Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js |
| Base de données | MongoDB |
| Mailing | EmailJS API |

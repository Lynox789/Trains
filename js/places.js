const params        = new URLSearchParams(window.location.search);
const trainId       = params.get('train_id');
const nbVoyageurs   = parseInt(params.get('nb_voyageurs') || '1');

let voitureActive   = 1;
let placesSelectionnees = {}; // { numeroPlace: true }
let voituresData    = {};     // { 1: { places: [...] }, 2: {...} }

// ── Initialisation
window.addEventListener('DOMContentLoaded', async () => {
    afficherRecapTrajet();
    await chargerPlaces();
    document.getElementById('recap-voyageurs').textContent =
        nbVoyageurs + (nbVoyageurs > 1 ? ' voyageurs' : ' voyageur');
});

// ── Résumé du trajet (depuis localStorage)
function afficherRecapTrajet() {
    const trajet = JSON.parse(localStorage.getItem('trajet_selectionne') || '{}');
    document.getElementById('recap-trajet').textContent  =
        (trajet.gare_depart || '—') + ' → ' + (trajet.gare_arrivee || '—');
    document.getElementById('recap-date').textContent    = trajet.date_depart  || '—';
    document.getElementById('recap-heure').textContent   = trajet.heure_depart || '—';
}

// ── Chargement des places depuis l'API
async function chargerPlaces() {
    if (!trainId) {
        document.getElementById('wagon-body').innerHTML =
            '<p style="color:red;padding:20px;">Aucun train sélectionné.</p>';
        return;
    }
    try {
        const res    = await fetch(`/api/train/${trainId}/places`);
        const data   = await res.json();

        // Indexer par numéro de voiture
        data.voitures.forEach(v => {
            voituresData[v.numero_voiture] = v;
        });

        // Créer les boutons de voiture
        const selector = document.getElementById('voiture-selector');
        selector.innerHTML = '';
        data.voitures.forEach((v, i) => {
            const btn = document.createElement('button');
            btn.className  = 'voiture-btn' + (i === 0 ? ' active' : '');
            btn.textContent = 'Voiture ' + v.numero_voiture;
            btn.onclick = () => changerVoiture(v.numero_voiture, btn);
            selector.appendChild(btn);
        });

        renderWagon();
    } catch (err) {
        console.error('Erreur chargement places:', err);
        document.getElementById('wagon-body').innerHTML =
            '<p style="color:red;padding:20px;">Erreur lors du chargement des places.</p>';
    }
}

// ── Changer de voiture 
function changerVoiture(num, btn) {
    voitureActive = num;
    document.querySelectorAll('.voiture-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderWagon();
}

// ── Rendu du wagon 
const ESPACES_APRES = [3, 4, 5, 6, 7, 8, 10, 11];

function renderWagon() {
    const body    = document.getElementById('wagon-body');
    body.innerHTML = '';

    const voiture = voituresData[voitureActive];
    if (!voiture) return;

    const totalPlaces     = voiture.total_places || 24;
    const placesParRangee = Math.ceil(totalPlaces / 2);

    for (let rangee = 0; rangee < 2; rangee++) {
        const col = document.createElement('div');
        col.className = 'rangee';

        const label = document.createElement('div');
        label.className = 'rangee-label';
        label.textContent = rangee === 0 ? 'A – B' : 'C – D';
        col.appendChild(label);

        for (let i = 1; i <= placesParRangee; i++) {
            const numero  = i + rangee * placesParRangee;
            const placeDB = voiture.places.find(p => p.numero === numero);
            const occupe  = placeDB ? placeDB.statut === 'occupee' : false;
            const selec   = !!placesSelectionnees[numero];

            const siege = document.createElement('div');
            siege.className = 'siege'
                + (occupe ? ' occupe'       : '')
                + (selec  ? ' selectionne'  : '');
            siege.textContent = numero;

            if (!occupe) {
                siege.onclick = () => toggleSiege(numero, siege);
            }

            col.appendChild(siege);

            // Espace couloir
            if (ESPACES_APRES.includes(i) && i < placesParRangee) {
                const sep = document.createElement('div');
                sep.style.height = '6px';
                col.appendChild(sep);
            }
        }

        body.appendChild(col);

        // Couloir central entre les deux rangées
        if (rangee === 0) {
            const couloir = document.createElement('div');
            couloir.className = 'couloir';
            couloir.innerHTML = '<div class="couloir-line"></div>';
            body.appendChild(couloir);
        }
    }
}

// ── Sélectionner / désélectionner une place
function toggleSiege(numero, el) {
    const nbActuel = Object.keys(placesSelectionnees).length;

    if (placesSelectionnees[numero]) {
        delete placesSelectionnees[numero];
        el.classList.remove('selectionne');
    } else {
        // Si quota atteint → désélectionner le premier
        if (nbActuel >= nbVoyageurs) {
            const premier = parseInt(Object.keys(placesSelectionnees)[0]);
            delete placesSelectionnees[premier];
            // Retirer la classe visuellement
            const ancienEl = document.querySelector(`.siege.selectionne`);
            if (ancienEl) ancienEl.classList.remove('selectionne');
        }
        placesSelectionnees[numero] = true;
        el.classList.add('selectionne');
    }

    updateRecap();
}

// ── Mise à jour du récap 
function updateRecap() {
    const places = Object.keys(placesSelectionnees).map(Number).sort((a, b) => a - b);
    const nb     = places.length;

    document.getElementById('info-progression').textContent =
        nb + ' / ' + nbVoyageurs + ' place' + (nbVoyageurs > 1 ? 's' : '');

    const tags = document.getElementById('tags-places');
    if (nb === 0) {
        tags.innerHTML = '<span class="no-place">Aucune place choisie</span>';
    } else {
        tags.innerHTML = places
            .map(p => `<span class="place-tag">Place ${p}</span>`)
            .join('');
    }

    document.getElementById('btn-valider').disabled = nb < nbVoyageurs;
}

// ── Validation et redirection 
async function validerPlaces() {
    const places = Object.keys(placesSelectionnees).map(Number).sort((a, b) => a - b);

    try {
        // Réserver les places en BDD
        const res = await fetch(`/api/train/${trainId}/reserver-places`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                numero_voiture: voitureActive,
                places_choisies: places
            })
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.message || 'Erreur lors de la réservation des places.');
            return;
        }

        // Sauvegarder en localStorage pour la page de paiement
        localStorage.setItem('places_choisies', JSON.stringify({
            voiture: voitureActive,
            places: places
        }));

        // ── Redirection selon le contexte
        const suite       = params.get('suite');
        const depart      = params.get('depart');
        const arrivee     = params.get('arrivee');
        const dateRetour  = params.get('date_retour');

        if (suite === 'retour') {
            // Il reste le retour à choisir
            window.location.href = `trajets.html?depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}&date=${encodeURIComponent(dateRetour)}&etape=retour`;
        } else {
            // Aller simple → panier
            window.location.href = 'panier.html';
        }

    } catch (err) {
        console.error('Erreur:', err);
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}
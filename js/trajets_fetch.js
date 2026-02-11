async function chargerTrajets() {
    try {
        const response = await fetch('/api/trajets');
        const trajets = await response.json();

        const container = document.getElementById('trajets-container');
        container.innerHTML = ''; // On vide le conteneur

        trajets.forEach(trajet => {
            const card = document.createElement('div');
            card.className = 'trajet-card';

            // Génération dynamique du HTML pour les escales
            let escalesHTML = '';
            if (trajet.escales && trajet.escales.length > 0) {
                trajet.escales.forEach((esc) => {
                    if (esc.type === 'attente') {
                        // Juste le texte d'attente le long de la ligne
                        escalesHTML += `
                            <div class="segment-attente">
                                <span class="label-attente">${esc.duree_segment} d'attente</span>
                            </div>`;
                    } else {
                        // Un point pour chaque horaire (14:40, 16:33, 16:56, 18:36)
                        escalesHTML += `
                            <div class="escale-etape">
                                <div class="dot active"></div>
                                <div class="info-etape">
                                    <strong>${esc.heure} - ${esc.gare}</strong>
                                    <div class="train-box">${esc.info}</div>
                                </div>
                            </div>`;
                    }
                });
            } else {
                escalesHTML = '<p style="padding:10px;">Trajet direct sans escale.</p>';
            }

            card.innerHTML = `
                <div class="trajet-summary" onclick="toggleDetails(this)">
                    <div class="time-info">
                        <div class="departure">
                            <strong>${trajet.heure_depart}</strong> 
                            <span>${trajet.gare_depart}</span> 
                        </div>
                        <div class="duration-line">
                            <div class="line"></div>
                            <span>${trajet.escales && trajet.escales.length > 2 ? 'Avec escales' : 'Direct'}</span>
                        </div>
                        <div class="arrival">
                            <strong>${trajet.heure_arrivee}</strong> 
                            <span>${trajet.gare_arrivee}</span> 
                        </div>
                    </div>
                    <div class="price-section">
                        <p class="opt-price">${trajet.prix_base}€</p>
                        <button class="btn-add">Choisir</button>
                    </div>
                </div>
                <div class="trajet-details" style="display: none;">
                    ${escalesHTML}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Erreur lors du chargement des trajets :", err);
    }
}

// Fonction pour l'affichage des détails (gardée de ton HTML d'origine)
function toggleDetails(element) {
    const details = element.nextElementSibling;
    details.style.display = (details.style.display === "none") ? "block" : "none";
}

// Lancement automatique
window.onload = chargerTrajets;
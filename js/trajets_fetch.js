async function chargerTrajets(dateSelectionnee = null) {
    try {
        let url = '/api/trajets';
        if(dateSelectionnee){
            url += `?date=${encodeURIComponent(dateSelectionnee)}`;
        }
        const response = await fetch(url);
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
                escalesHTML = `
                    <div class="escale-etape">
                        <div class="dot active"></div>
                        <div class="info-etape"><strong>${trajet.heure_depart} - ${trajet.gare_depart}</strong></div>
                    </div>
                    <div class="segment-attente"><span class="label-attente">Trajet direct</span></div>
                    <div class="escale-etape">
                        <div class="dot active"></div>
                        <div class="info-etape"><strong>${trajet.heure_arrivee} - ${trajet.gare_arrivee}</strong></div>
                    </div>`;            
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

async function chargerCalendrier() {
    try {
        // On récupère les prix par jour
        const response = await fetch('/api/calendrier-prix');
        const jours = await response.json();

        const container = document.querySelector('.calendar-grid');
        if (!container) return; // Sécurité si l'élément n'existe pas
        
        container.innerHTML = '';

        // On cherche le prix le moins cher pour l'US 1.2
        const prixMin = Math.min(...jours.map(j => j.prix));

        jours.forEach(jour => {
            const dayDiv = document.createElement('div');
            // On ajoute la classe 'active' si c'est le premier jour par exemple
            dayDiv.className = 'day'; 
            
            const isCheapest = jour.prix === prixMin;

            dayDiv.innerHTML = `
                <span>${jour.date}</span>
                <p class="${isCheapest ? 'cheapest' : ''}">${jour.prix}€</p>
            `;

            // au clic n filtre les trajets de l'EPIC 1
            dayDiv.onclick = () => {
                document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
                dayDiv.classList.add('active');
                
                // On appelle la fonction de l'EPIC 1 avec la date choisie
                chargerTrajets(jour.date);
            };

            container.appendChild(dayDiv);
        });
    } catch (err) {
        console.error("Erreur calendrier:", err);
    }
}

// Fonction pour l'affichage des détails (gardée de ton HTML d'origine)
function toggleDetails(element) {
    const details = element.nextElementSibling;
    details.style.display = (details.style.display === "none") ? "block" : "none";
}

// Lancement automatique
window.onload = () => {
    chargerCalendrier();
    chargerTrajets();
}
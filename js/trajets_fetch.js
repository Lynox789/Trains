function recupererParametres() {
    const params = new URLSearchParams(window.location.search);
    return {
        depart: params.get('depart'),
        arrivee: params.get('arrivee'),
        date: params.get('date'),
        retour: params.get('retour'),
        etape: params.get('etape') || 'aller' // Par défaut, on affiche l'aller
    };
}

async function chargerTrajets(dateSelectionnee = null) {
    const searchData = recupererParametres();

    const dateQuery = dateSelectionnee || searchData.date;

    if (dateSelectionnee && dateSelectionnee !== searchData.date) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('date', dateSelectionnee);
        window.history.pushState({}, '', newUrl);
    }
    const titre = document.getElementById('titre-trajet');
    if(titre){
        const mode = searchData.etape === 'aller' ? 'Aller' : 'Retour';
        titre.innerHTML = `${mode} : ${searchData.depart} <span style= "color:var(--cyan)">➔</span> ${searchData.arrivee}`;
    }

    try {
        // On construit l'URL de l'API en fonction de la date sélectionnée
        let apiUrl = `/api/trajets?date=${encodeURIComponent(dateQuery)}`;
        if(searchData.depart) {
            apiUrl += `&gare_depart=${encodeURIComponent(searchData.depart)}`;
        }
        if(searchData.arrivee) {
            apiUrl += `&gare_arrivee=${encodeURIComponent(searchData.arrivee)}`;
        }
        
        const response = await fetch(apiUrl);
        const trajets = await response.json();

        const container = document.getElementById('trajets-container');
        container.innerHTML = ''; // On vide le conteneur

        if(trajets.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: white;">
                    <h2> Aucun train le ${dateQuery} </h2>
                    <p> Essayez une autre date ou vérifiez les gares de départ/arrivée. </p>
                </div>`;
            return;
        }

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
            card.querySelector('.btn-add').onclick = (e) => {
                e.stopPropagation(); // Empêche le toggle des détails
                choisirTrajet(trajet, searchData);
            };
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Erreur lors du chargement des trajets :", err);
    }
}

function choisirTrajet(trajet, searchData) {
    const billet = {
        id: trajet._id,
        depart: trajet.gare_depart,
        arrivee: trajet.gare_arrivee,
        date: trajet.date_depart,
        heure_depart: trajet.heure_depart,
        heure_arrivee: trajet.heure_arrivee,
        prix: trajet.prix_base,
        type: searchData.etape
    };
    localStorage.setItem(`panier_${searchData.etape}`, JSON.stringify(billet));

    if(searchData.etape === 'aller' && searchData.retour && searchData.retour !== 'undefined' && searchData.retour !== '') {
        // Rediriger vers la même page mais pour le retour
        window.location.href = `trajets.html?depart=${encodeURIComponent(searchData.arrivee)}&arrivee=${encodeURIComponent(searchData.depart)}&date=${encodeURIComponent(searchData.retour)}&etape=retour`;
    } else {
        alert("Trajet ajouté au panier !");
        // Rediriger vers le panier
        // window.location.href = 'panier.html';
    }
}

async function chargerCalendrier() {
    const searchData = recupererParametres();

    try {
        // On envoie aussi les gares au calendrier pour n'avoir que les prix pertinents
        let url = `/api/calendrier-prix`;
        const params = [];
        if(searchData.depart) {
            params.push(`gare_depart=${encodeURIComponent(searchData.depart)}`);
        }
        if(searchData.arrivee) {
            params.push(`gare_arrivee=${encodeURIComponent(searchData.arrivee)}`);
        }
        if(params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        // On récupère les prix par jour
        const response = await fetch(url);
        const jours = await response.json();

        const container = document.querySelector('.calendar-grid');
        if (!container) return; // Sécurité si l'élément n'existe pas
        
        container.innerHTML = '';
        if (jours.length === 0) {
            container.innerHTML = `
                <p style="grid-column: 1/-1; text-align:center; opacity:0.7;">
                    Aucune date disponible pour ce trajet.
                </p>`;
            return;
        }
        // On cherche le prix le moins cher pour l'US 1.2
        const prixMin = Math.min(...jours.map(j => j.prix));

        jours.forEach(jour => {
            const dayDiv = document.createElement('div');
            // On ajoute la classe 'active' si c'est le premier jour par exemple
            dayDiv.className = 'day'; 

            // Si c'est la date active (celle de l'URL ou cliquée)
            if (jour.date === searchData.date) {
                dayDiv.classList.add('active');
            }
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

// Fonction pour l'affichage des détails 
function toggleDetails(element) {
    const details = element.nextElementSibling;
    details.style.display = (details.style.display === "none") ? "block" : "none";
}

// Lancement automatique
window.onload = () => {
    chargerCalendrier();
    chargerTrajets();
}
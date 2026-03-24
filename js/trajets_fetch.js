function obtenirValeurDate(dateStr) {
    if (!dateStr) return 0;
    const parts = dateStr.split(' ');
    if (parts.length < 3) return 0; 
    
    const jour = parseInt(parts[1], 10);
    const moisStr = parts[2].replace('.', '').toLowerCase();
    
    const moisMap = { 'janv': 0, 'fév': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5, 'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11 };
    const mois = moisMap[moisStr] !== undefined ? moisMap[moisStr] : 0;
    
    // On récupère l'année actuelle 
    let annee = new Date().getFullYear();

    // Gestion du passage à la nouvelle année (On est en Décembre et on réserve pour Janvier)
    const moisActuel = new Date().getMonth();
    // Si on est en fin d'année (oct, nov, dec) et qu'on réserve pour début d'année (janv, fev, mars)
    if (moisActuel >= 9 && mois <= 2) {
        annee += 1; 
    }
    
    return new Date(annee, mois, jour).getTime();
}


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

const voyageursData = JSON.parse(localStorage.getItem('voyageurs')) || [{ age: 30 }];
const nbVoyageurs = voyageursData.length;


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

            const prixAjuste = (trajet.prix_base * nbVoyageurs).toFixed(2);

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
                        <p class="opt-price">${prixAjuste}€</p>
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

let trajetEnCoursDeSelection = null;
let searchDataGlobal = null;

function choisirTrajet(trajet, searchData) {
    trajetEnCoursDeSelection = trajet;
    searchDataGlobal = searchData;
    
    //remplit le petit récap dans le panneau de droite
    const recap = document.getElementById('recap-train-choisi');
    recap.innerHTML = `
        <div class="recap-line"><span class="recap-label">Date</span><span class="recap-value">${trajet.date_depart}</span></div>
        <div class="recap-line"><span class="recap-label">Départ</span><span class="recap-value">${trajet.heure_depart} - ${trajet.gare_depart}</span></div>
        <div class="recap-line"><span class="recap-label">Arrivée</span><span class="recap-value">${trajet.heure_arrivee} - ${trajet.gare_arrivee}</span></div>
        
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 15px 0;">
        <div class="recap-line"><span class="recap-label">Voyageurs</span><span class="recap-value" style="color: var(--cyan);">${nbVoyageurs} personne(s)</span></div>
        <div class="recap-line"><span class="recap-label">Prix unitaire</span><span class="recap-value">${trajet.prix_base} € / pers.</span></div>
    `;
    
    // on décoche toutes les options précédentes
    document.querySelectorAll('#options-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // mettre a jour le prix total initial
    calculerPrixTotalOptions();

    // afficher le panneau
    const panelOverlay = document.getElementById('options-panel');
    panelOverlay.style.display = 'flex';
    setTimeout(() => {
        panelOverlay.classList.add('open');
    }, 10);
}

function calculerPrixTotalOptions() {
    if(!trajetEnCoursDeSelection) return;

    let prixTotal = trajetEnCoursDeSelection.prix_base * nbVoyageurs; // Prix de base multiplié par le nombre de voyageurs

    // on parcourt toutes les checkbox cochées pour ajouter leur prix

    document.querySelectorAll('#options-panel input[type="checkbox"]:checked').forEach(radio => {
       let prixOption = parseFloat(radio.getAttribute('data-prix')) || 0;
       prixTotal += (prixOption * nbVoyageurs);
    });
    // afficher du prix total dans le panneau
    document.getElementById('prix-total-options').innerText = prixTotal.toFixed(2);
}

// ecouteur d'événement : 
    // recalculer le prix total à chaque changement d'option
    document.querySelectorAll('#options-panel input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', calculerPrixTotalOptions);
    });

    function fermerPanneauOptions() {
        const panelOverlay = document.getElementById('options-panel');
        panelOverlay.classList.remove('open');
        // attendre la fin de l'animation avant de cacher le panneau
        setTimeout(() => {
            panelOverlay.style.display = 'none';
        }, 300);
    }
    
    document.getElementById('close-options').addEventListener('click', fermerPanneauOptions);
    // fermetr si on clique sur le fond sombre
    document.getElementById('options-panel').addEventListener('click', (e) => {
        if(e.target === e.currentTarget) {
            fermerPanneauOptions();
        }
    });

// validaiton final  
document.getElementById('btn-valider-options').addEventListener('click', () => {
    if(!trajetEnCoursDeSelection) return;

    const prixTotalAffiche = parseFloat(document.getElementById('prix-total-options').innerText);

    const optionsChoisies = {};
    document.querySelectorAll('#options-panel input[type="checkbox"]:checked').forEach(radio => {
        optionsChoisies[radio.name] = true;
    });

    const billet = {
        id: trajetEnCoursDeSelection._id,
        depart: trajetEnCoursDeSelection.gare_depart,
        arrivee: trajetEnCoursDeSelection.gare_arrivee,
        date: trajetEnCoursDeSelection.date_depart,
        heure_depart: trajetEnCoursDeSelection.heure_depart,
        heure_arrivee: trajetEnCoursDeSelection.heure_arrivee,
        prix_base: trajetEnCoursDeSelection.prix_base,
        prix_total: prixTotalAffiche, 
        options: optionsChoisies,    
        type: searchDataGlobal.etape
    };
    
    localStorage.setItem(`panier_${searchDataGlobal.etape}`, JSON.stringify(billet));
    // sauvegarder le trajet pour la page places
    localStorage.setItem('trajet_selectionne', JSON.stringify({
        _id:          trajetEnCoursDeSelection._id,
        gare_depart:  trajetEnCoursDeSelection.gare_depart,
        gare_arrivee: trajetEnCoursDeSelection.gare_arrivee,
        date_depart:  trajetEnCoursDeSelection.date_depart,
        heure_depart: trajetEnCoursDeSelection.heure_depart,
        prix_total:   prixTotalAffiche
    }));

    if(searchDataGlobal.etape === 'aller' && searchDataGlobal.retour && searchDataGlobal.retour !== 'undefined' && searchDataGlobal.retour !== '') {
         // Aller-retour d'abord choisir les places de l'aller
        window.location.href = `places.html?train_id=${trajetEnCoursDeSelection._id}&nb_voyageurs=${nbVoyageurs}&suite=retour&depart=${encodeURIComponent(searchDataGlobal.arrivee)}&arrivee=${encodeURIComponent(searchDataGlobal.depart)}&date_retour=${encodeURIComponent(searchDataGlobal.retour)}`;
    } else {
        // Aller simple places puis panier
        window.location.href = `places.html?train_id=${trajetEnCoursDeSelection._id}&nb_voyageurs=${nbVoyageurs}&suite=panier`;    }

});

async function chargerCalendrier() {
    const searchData = recupererParametres();

    let timestampAller = 0;
    if(searchData.etape === 'retour') {
        const panierAller = JSON.parse(localStorage.getItem('panier_aller'));
        if(panierAller && panierAller.date) {
            timestampAller = obtenirValeurDate(panierAller.date);
        } 
    } 

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
                <p style="text-align:center; opacity:0.7; width:100%;">
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

            const timestampJour = obtenirValeurDate(jour.date);
            const prixAfficheCal = (jour.prix * nbVoyageurs).toFixed(2); // Prix ajusté pour le nombre de voyageurs

            // Si on est sur la page de retour et que ce jour est avant l'aller, on bloque la sélection
            if (searchData.etape === 'retour' && timestampAller && timestampJour < timestampAller) {
                dayDiv.innerHTML = `
                    <span>${jour.date}</span>
                    <p style="opacity: 0.5;">--</p>
                `;
                // On grise la case
                dayDiv.style.opacity = '0.3';
                dayDiv.style.cursor = 'not-allowed';
                dayDiv.style.pointerEvents = 'none'; // Empêche le clic
            }else {
                dayDiv.innerHTML = `
                    <span>${jour.date}</span>
                    <p class="${isCheapest ? 'cheapest' : ''}">${prixAfficheCal}€</p>
                `;

                // au clic n filtre les trajets de l'EPIC 1
                dayDiv.onclick = () => {
                    document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
                    dayDiv.classList.add('active');
                    
                    // On appelle la fonction de l'EPIC 1 avec la date choisie
                    chargerTrajets(jour.date);
                };
            }
            container.appendChild(dayDiv);
        });

        // gestion des boutons de scroll du calendrier
        setTimeout(() => { // Timeout pour s'assurer que le DOM est prêt
            const activeDay = document.querySelector('.day.active');
            if(activeDay) {
                // block: 'nearest' et inline: 'center' permet de mettre la case au milieu du carrousel
                activeDay.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
            }
        }, 100);
        // Scroll manuel avec les boutons
        const btnLeft = document.getElementById('scroll-left');
        const btnRight = document.getElementById('scroll-right');
        if(btnLeft && btnRight) {
            btnLeft.onclick = () => {
                container.scrollBy({left: -300, behavior: 'smooth'});
            };
            btnRight.onclick = () => {
                container.scrollBy({left: 300, behavior: 'smooth'});
            };
        }
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

function ajouterAuPanier(trajet) {
    const params = new URLSearchParams(window.location.search);
    const estRetour = params.get('retour') === 'true'; 

    const billet = {
        id: trajet._id,
        gare_depart: trajet.gare_depart,
        gare_arrivee: trajet.gare_arrivee,
        date_depart: trajet.date_depart,
        heure_depart: trajet.heure_depart,
        prix: trajet.prix_base, 
        type: estRetour ? 'Retour' : 'Aller'
    };

    if (estRetour) {
        localStorage.setItem('panier_retour', JSON.stringify(billet));
        alert('Trajet RETOUR ajouté !');
        window.location.href = '/panier';
    } else {
        localStorage.setItem('panier_aller', JSON.stringify(billet));

        const typeVoyage = localStorage.getItem('type_voyage') || 'aller-simple';
        
        if (typeVoyage === 'aller-retour') {
            if(confirm('Aller ajouté ! Voulez-vous choisir le retour maintenant ?')) {
                const dateRetour = localStorage.getItem('date_retour_prevue');
                window.location.href = `trajets.html?depart=${billet.gare_arrivee}&arrivee=${billet.gare_depart}&date=${dateRetour}&retour=true`;
            } else {
                window.location.href = '/panier';
            }
        } else {
            alert('Billet ajouté au panier !');
            window.location.href = '/panier';
        }
    }
}
function chargerPanier() {
    const container = document.getElementById('liste-billets');
    const totalSpan = document.getElementById('prix-total');

    const aller = JSON.parse(localStorage.getItem('panier_aller'));
    const retour = JSON.parse(localStorage.getItem('panier_retour'));

    const voyageursInitiaux = JSON.parse(localStorage.getItem('voyageurs')) || [{age: 30}];

    container.innerHTML = ''; 
    let totalGlobal = 0;

    const genererHtmlTrajet = (trajet, key) => {
        if (!trajet) return '';

        if (!trajet.passagers) {
            trajet.passagers = JSON.parse(JSON.stringify(voyageursInitiaux)); 

            if(trajet.passagers.length === 0) {
                 trajet.passagers.push({age: 30, nom: ''});
            }
            localStorage.setItem(key, JSON.stringify(trajet)); 
        }

        const nbV = trajet.passagers.length;
        
        const prixTotalTrajet = (trajet.prix_base * nbV);

        
        totalGlobal += prixTotalTrajet;

        let passagersHTML = trajet.passagers.map((p, index) => `
            <div class="passenger-input-row">
                
                <div class="input-group full-width">
                    <label>Nom complet</label>
                    <input type="text" placeholder="Ex: Jean Dupont" value="${p.nom || ''}" 
                        oninput="modifierPassager('${key}', ${index}, 'nom', this.value)">
                </div>

                <div class="input-group small-width">
                    <label>Âge</label>
                    <input type="number" min="0" max="120" value="${p.age || 30}" 
                        oninput="modifierPassager('${key}', ${index}, 'age', this.value)">
                </div>

                <button class="btn-delete-row" title="Retirer ce voyageur"
                    onclick="retirerPassager('${key}', ${index})">×</button>
            </div>
        `).join('');

        return `
        <div class="trajet-card" style="margin-bottom: 20px;">
            <h3 style="color: var(--cyan); margin-bottom: 10px;">Trajet ${key === 'panier_aller' ? 'Aller' : 'Retour'}</h3>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
                <span>${trajet.depart || trajet.gare_depart}</span>
                <span>➔</span>
                <span>${trajet.arrivee || trajet.gare_arrivee}</span>
            </div>
            
            <div class="passagers-liste">
                ${passagersHTML}
                <button onclick="ajouterPassager('${key}')" class="btn-member" style="margin-top:15px; font-size:0.8rem;">
                    + Ajouter un voyageur
                </button>
            </div>
            
            <p class="opt-price" style="text-align:right; margin-top:15px; font-size:1.4rem;">
                ${prixTotalTrajet.toFixed(2)} €
            </p>
        </div>`;
    };

    container.innerHTML += genererHtmlTrajet(aller, 'panier_aller');
    container.innerHTML += genererHtmlTrajet(retour, 'panier_retour');
    
    totalSpan.textContent = totalGlobal.toFixed(2);
}

function modifierPassager(key, index, champ, valeur) {
    let trajet = JSON.parse(localStorage.getItem(key));
    trajet.passagers[index][champ] = valeur;
    localStorage.setItem(key, JSON.stringify(trajet));
}

function ajouterPassager(key) {
    let trajet = JSON.parse(localStorage.getItem(key));

    trajet.passagers.push({nom: "", age: 30});

    trajet.prix_total = trajet.prix_base * trajet.passagers.length;
    
    localStorage.setItem(key, JSON.stringify(trajet));
    chargerPanier(); 
}

function retirerPassager(key, index) {
    let trajet = JSON.parse(localStorage.getItem(key));
    
    if(trajet.passagers.length <= 1) {
        alert("Il faut au moins un passager pour ce billet !");
        return;
    }

    trajet.passagers.splice(index, 1);

    trajet.prix_total = trajet.prix_base * trajet.passagers.length;
    
    localStorage.setItem(key, JSON.stringify(trajet));
    chargerPanier();
}

function confirmerCommande() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert("Vous devez être connecté pour commander un billet.");
        window.location.href = 'login.html'; 
        return;
    }
    
    window.location.href = 'recapitulatif.html';
}

document.addEventListener('DOMContentLoaded', chargerPanier);
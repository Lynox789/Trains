document.addEventListener('DOMContentLoaded', () => {
    chargerPanier();
});

function chargerPanier() {
    const container = document.getElementById('liste-billets');
    const totalSpan = document.getElementById('prix-total');
    
    // Récupération des données du localStorage 
    const aller = JSON.parse(localStorage.getItem('panier_aller'));
    const retour = JSON.parse(localStorage.getItem('panier_retour'));

    container.innerHTML = ''; 
    let total = 0;

    // Fonction utilitaire pour générer le HTML d'un billet
    const creerHtmlBillet = (trajet, type) => {
        const prix = parseFloat(trajet.prixTotal || trajet.prix); 
        total += prix;

        return `
        <div class="ticket-card" id="card-${type}">
            <div>
                <h3>Trajet ${type === 'panier_aller' ? 'Aller' : 'Retour'}</h3>
                <p><strong>${trajet.gare_depart}</strong> ➝ <strong>${trajet.gare_arrivee}</strong></p>
                <p>Date : ${trajet.date_depart} à ${trajet.heure_depart}</p>
                <p>Voyageurs : ${localStorage.getItem('voyageurs') || 1}</p>
            </div>
            <div style="text-align: right;">
                <p class="prix" style="font-size: 1.5rem; color: #6c63ff; font-weight: bold;">${prix.toFixed(2)} €</p>
                <button class="btn-delete" onclick="supprimerItem('${type}')">
                    <img src="img/trash.svg" alt="Supprimer" width="24">
                </button>
            </div>
        </div>
        `;
    };

    let aDesBillets = false;

    if (aller) {
        container.innerHTML += creerHtmlBillet(aller, 'panier_aller');
        aDesBillets = true;
    }

    if (retour) {
        container.innerHTML += creerHtmlBillet(retour, 'panier_retour');
        aDesBillets = true;
    }

    if (!aDesBillets) {
        container.innerHTML = '<p style="text-align:center; color: #666;">Votre panier est vide.</p>';
        document.querySelector('.btn-payer').style.display = 'none';
    }

    totalSpan.textContent = total.toFixed(2);
}

function supprimerItem(key) {
    if(confirm("Voulez-vous vraiment supprimer ce trajet du panier ?")) {
        localStorage.removeItem(key);
        chargerPanier();
    }
}
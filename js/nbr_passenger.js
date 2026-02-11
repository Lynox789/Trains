let nbVoyageurs = 0;
const btnAjouter = document.getElementById('btn-ajouter-voyageur');
const container = document.getElementById('container-voyageurs');
const compteur = document.getElementById('compteur-voyageurs');

btnAjouter.addEventListener('click', () => {
    nbVoyageurs++;
    updateCompteur();

    // Création de la carte voyageur
    const voyageurDiv = document.createElement('div');
    voyageurDiv.className = 'voyageur-card';
    voyageurDiv.id = `voyageur-${nbVoyageurs}`;
    
    voyageurDiv.innerHTML = `
        <div class="voyageur-header">
            <span><img src="img/Member.svg" style="width:15px"> Voyageur ${nbVoyageurs}</span>
            <button type="button" class="btn-delete" onclick="supprimerVoyageur(${nbVoyageurs})"><img src="img/trash.svg" style="width:15px"></button>
        </div>
        
        <div class="voyageur-body">
            <input type="number" name="age[]" placeholder="Âge" min="0">
            
            <div class="adherent-section">
                <p>Est-il adhérent ?</p>
                <div class="radio-group">
                    <div>
                        <label> Oui </label>
                        <input type="radio" name="adherent_${nbVoyageurs}" value="oui">
                    </div>
                    
                    <div>
                        <label> Non </label>
                        <input type="radio" name="adherent_${nbVoyageurs}" value="non" checked>
                    </div>
                    </div>
            </div>
        </div>
    `;

    container.appendChild(voyageurDiv);
});

function supprimerVoyageur(id) {
    const el = document.getElementById(`voyageur-${id}`);
    if (el) {
        el.remove();
        nbVoyageurs--;
        updateCompteur();
    }
}

function updateCompteur() {
    compteur.innerText = nbVoyageurs;
}
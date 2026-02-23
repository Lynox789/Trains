let nbVoyageurs = 0;
const btnAjouter = document.getElementById('btn-ajouter-voyageur');
const container = document.getElementById('container-voyageurs');
const compteur = document.getElementById('compteur-voyageurs');

btnAjouter.addEventListener('click', () => {

    // Création de la carte voyageur
    const voyageurDiv = document.createElement('div');
    voyageurDiv.className = 'voyageur-card';
    
    voyageurDiv.innerHTML = `
        <div class="voyageur-header">
            <span class="voyageur-title"><img src="img/Member.svg" style="width:15px; margin-right:8px; filter:brightness(0) invert(1);"> Voyageur</span>
            <button type="button" class="btn-delete"><img src="img/trash.svg" style="width:18px;"></button>
        </div>
        
        <div class="voyageur-body">
            <input type="number" name="age[]" placeholder="Âge" min="0" required>
        </div>
    `;

    const btnDelete = voyageurDiv.querySelector('.btn-delete');
    btnDelete.addEventListener('click', () => {
        voyageurDiv.remove();
        mettreAJourAffichage();
    });
    
    container.appendChild(voyageurDiv);
    mettreAJourAffichage();
});

function mettreAJourAffichage() {
    const cartes = container.querySelectorAll('.voyageur-card');
    nbVoyageurs = cartes.length;

    compteur.innerText = nbVoyageurs;

    cartes.forEach((carte,index) => {
        const numeroReel = index + 1;

        const title = carte.querySelector('.voyageur-title');
        title.innerHTML = `<img src="img/Member.svg" style="width:15px; margin-right:8px; filter:brightness(0) invert(1);"> Voyageur ${numeroReel}`;

        const radios = carte.querySelectorAll('.radio-adherent');
        radios.forEach(radio => {
            radio.name = `adherent_${numeroReel}`;
        });
    });
}
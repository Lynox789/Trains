let nbVoyageurs = 0;
const container = document.getElementById('container-voyageurs');
const compteur = document.getElementById('compteur-voyageurs');

function addV() {
    const voyageurDiv = document.createElement('div');
    voyageurDiv.className = 'voyageur-card';
    
    voyageurDiv.innerHTML = `
        <div class="voyageur-header">
            <span class="voyageur-title">
                <img src="img/Member.svg" style="width:15px; margin-right:8px; filter:brightness(0) invert(1);">
                Voyageur
            </span>
            <button type="button" class="btn-delete"><img src="img/trash.svg" style="width:18px;"></button>
        </div>
        <div class="voyageur-body">
            <input type="number" name="age[]" placeholder="Âge" min="0" required>
        </div>
    `;

    voyageurDiv.querySelector('.btn-delete').addEventListener('click', () => {
        voyageurDiv.remove();
        mettreAJourAffichage();
    });

    container.appendChild(voyageurDiv);
    mettreAJourAffichage();
}

function removeV() {
    const cartes = container.querySelectorAll('.voyageur-card');
    if (cartes.length === 0) return;
    cartes[cartes.length - 1].remove();
    mettreAJourAffichage();
}

function mettreAJourAffichage() {
    const cartes = container.querySelectorAll('.voyageur-card');
    nbVoyageurs = cartes.length;
    compteur.innerText = nbVoyageurs;

    // Met à jour le label counter-label si présent
    const label = document.getElementById('counter-label');
    if (label) {
        label.textContent = nbVoyageurs === 0 ? 'Aucun voyageur'
            : nbVoyageurs === 1 ? '1 voyageur'
            : `${nbVoyageurs} voyageurs`;
    }

    cartes.forEach((carte, index) => {
        const title = carte.querySelector('.voyageur-title');
        title.innerHTML = `<img src="img/Member.svg" style="width:15px; margin-right:8px; filter:brightness(0) invert(1);"> Voyageur ${index + 1}`;

        carte.querySelectorAll('.radio-adherent').forEach(radio => {
            radio.name = `adherent_${index + 1}`;
        });
    });
}
function activerAutocomplete(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    input.addEventListener('input', async() => {
        const query = input.value;

        if(query.length < 2){
            list.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/gares?q=${encodeURIComponent(query)}`);
            const gares = await response.json();        

            list.innerHTML = '';

            if(gares.length > 0 ){
                list.style.display = "block"
                gares.forEach(gare => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.textContent = gare;
                    div.onclick = () => {
                        input.value = gare;
                        list.style.display = 'none';
                    };
                    list.appendChild(div);
                });
            }else {
                list.style.display = 'none';
            }
        }catch(err){
            console.error("error autocomplete:", err);
        }
    });

    // Cacher la liste si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== list) {
            list.style.display = 'none';
        }
    });
}

// On active l'autocomplete sur les deux champs
activerAutocomplete('lieu_depart', 'suggestions-depart');
activerAutocomplete('lieu_arrivee', 'suggestions-arrivee');


function formaterDatePourBDD(dateInput) {
    if (!dateInput) return "";
    
    const date = new Date(dateInput);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    // Ex: "mer. 11 févr."
    let dateFormatee = date.toLocaleDateString('fr-FR', options);
    dateFormatee = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
    return dateFormatee.replace('févr.', 'fév.').replace('janv.', 'janv.'); 
}



// Gestion des dates (Blocage des dates impossibles)
const dateDepartInput = document.getElementById('date_depart');
const dateRetourInput = document.getElementById('date_retour');

// Bloquer les dates dans le passé pour l'aller
const today = new Date().toISOString().split('T')[0];
dateDepartInput.min = today;

// Quand on choisit une date d'aller, on met à jour le retour
dateDepartInput.addEventListener('change', () => {
    // La date minimum pour le retour devient la date de l'aller
    dateRetourInput.min = dateDepartInput.value;
    
    // Si l'utilisateur avait déjà choisi un retour AVANT le nouvel aller, on efface le retour
    if (dateRetourInput.value && dateRetourInput.value < dateDepartInput.value) {
        dateRetourInput.value = '';
    }
});


function rechercher() {
    const depart = document.getElementById('lieu_depart').value;
    const arrivee = document.getElementById('lieu_arrivee').value;
    const dateAllerRaw = document.getElementById('date_depart').value;
    const dateRetourRaw = document.getElementById('date_retour').value;

    if(!depart || !arrivee || !dateAllerRaw) {
        alert("Veuillez remplir le départ, l'arrivée et la date d'aller.");
        return;
    }

    const dateAller = formaterDatePourBDD(dateAllerRaw);
    const dateRetour = dateRetourRaw ? formaterDatePourBDD(dateRetourRaw) : "";

    const voyageurs = [];
    const cartesVoyageur = document.querySelectorAll('.voyageur-card');
    
    cartesVoyageur.forEach(carte => {
        const ageInput = carte.querySelector('input[type="number"]');
        voyageurs.push({
            age: ageInput && ageInput.value ? parseInt(ageInput.value) : 30,
        });
    });

    //si l'utilisateur n'a ajouter aucun voyageur, on ajoute un voyageur par défaut pour éviter les erreurs dans la page de résultats 
    if(voyageurs.length === 0) {
        voyageurs.push({ age: 30});
    }

    //On sauvegard le tableau des voyageur dans le mémoire du navigateur pour pouvoir le récupérer dans la page de résultats
    localStorage.setItem('voyageurs', JSON.stringify(voyageurs));   

    // redirection 
    window.location.href = `trajets.html?depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}&date=${encodeURIComponent(dateAller)}&retour=${encodeURIComponent(dateRetour)}&etape=aller`;
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill_arrivee');

    if(prefill){
        document.getElementById('lieu_arrivee').value = prefill;
    }
};
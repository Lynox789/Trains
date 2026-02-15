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

    window.location.href = `trajets.html?depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}&date=${encodeURIComponent(dateAller)}&retour=${encodeURIComponent(dateRetour)}&etape=aller`;
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('prefill_arrivee');

    if(prefill){
        document.getElementById('lieu_arrivee').value = prefill;
    }
};
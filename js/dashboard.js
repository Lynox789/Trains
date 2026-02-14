const inputLieu = document.getElementById('lieu');
const suggestionsBox = document.getElementById('suggestions-liste');
const searchWrapper = document.querySelector('.search-wrapper');
const body = document.body;
const overlay = document.getElementById('focus-overlay');


inputLieu.addEventListener('input', async () =>{
    activerFocusMode();

    //ecouter la frappe de l'utilisateur
    const query = inputLieu.value;

    
    if(query.length < 2){
        searchWrapper.classList.remove('open');
        return;
    }

    try{
        const response = await fetch(`/api/gares?q=${encodeURIComponent(query)}`);
        const gares = await response.json();

        //affichage des résultats
        if(gares.length > 0){
            suggestionsBox.innerHTML = ''; // on vide la liste précédente
            searchWrapper.classList.add('open'); // afficher la liste

            gares.forEach(gare =>{
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = gare;

                // au clic sur une suggestion
                div.onclick = () => {
                    inputLieu.value = gare;
                    quitterFocusMode();
                };
                suggestionsBox.appendChild(div);
            });
        }else{
            searchWrapper.classList.remove('open');
        }
    }catch (err){
        console.error("error autocomplétion: ", err);
    }
});

inputLieu.addEventListener('focus',activerFocusMode);
overlay.addEventListener('click', quitterFocusMode)

function activerFocusMode(){
    body.classList.add('search-active');
}

function quitterFocusMode(){
    body.classList.remove('search-active');
    searchWrapper.classList.remove('open');
    suggestionsBox.innerHTML = '';
}

document.getElementById('focus-overlay').addEventListener('click', () => {
    quitterFocusMode();
});

// Redirection vers recherche.html avec la valeur pré-remplie
function allerVersRecherche() {
    const destination = inputLieu.value;
    // On envoie la destination dans l'URL vers la page recherche.html
    window.location.href = `recherche.html?prefill_arrivee=${encodeURIComponent(destination)}`;
}
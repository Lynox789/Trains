document.addEventListener('DOMContentLoaded', () => {
    const btnReverse = document.getElementById('btn_reverse');
    const lieuDepart = document.getElementById('lieu_depart');
    const lieuArrivee = document.getElementById('lieu_arrivee');

    if(btnReverse) {
        btnReverse.addEventListener('click', (e) => {
            e.preventDefault();
            const temp = lieuDepart.value;
            lieuDepart.value = lieuArrivee.value;
            lieuArrivee.value = temp;

        });
    }
});
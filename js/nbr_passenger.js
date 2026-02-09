const nbr_personne = document.getElementById('nbr_personne');
const btn_plus = document.querySelector('.btn-nbr:nth-child(3)');
const btn_moins = document.querySelector('.btn-nbr:nth-child(1)');

btn_plus.addEventListener('click', () => {
    let currentValue = parseInt(nbr_personne.textContent);
    if (currentValue < 10) {
        nbr_personne.textContent = currentValue + 1;
    }
});

btn_moins.addEventListener('click', () => {
    let currentValue = parseInt(nbr_personne.textContent);
    if (currentValue > 1) {
        nbr_personne.textContent = currentValue - 1;
    }
});
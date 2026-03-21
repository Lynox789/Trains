document.addEventListener('DOMContentLoaded', () => {
    // EPIC 6 - Tâche 1: Générer et afficher la référence de réservation
    const reference = 'RES-' + Math.floor(Math.random() * 900000 + 100000);
    document.getElementById('ref-display').textContent = reference;
    localStorage.setItem('current_ref', reference); // Sauvegarde pour le billet

    // Récupérer le prix total depuis le panier
    let total = 0;
    const aller = JSON.parse(localStorage.getItem('panier_aller'));
    const retour = JSON.parse(localStorage.getItem('panier_retour'));
    if (aller) total += parseFloat(aller.prix_total);
    if (retour) total += parseFloat(retour.prix_total);
    document.getElementById('total-pay').textContent = total.toFixed(2);

    // EPIC 7 - Tâches 1 & 2 : Gérer le temps inactif et afficher le compteur
    let timeLeft = 180; // 3 minutes en secondes
    const timerDisplay = document.getElementById('timer');
    
    const interval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        timerDisplay.textContent = `0${min}:${sec < 10 ? '0' + sec : sec}`;
        
        // EPIC 7 - Tâche 3 : Fermeture de session si temps expiré
        if (timeLeft <= 0) {
            clearInterval(interval);
            alert("Temps expiré. La session a été fermée pour des raisons de sécurité.");
            window.location.href = 'dashboard.html';
        }
    }, 1000);

    // Soumission du formulaire
    document.getElementById('form-paiement').addEventListener('submit', (e) => {
        e.preventDefault();
        clearInterval(interval); // On arrête le timer
        
        document.querySelector('.btn-payer').style.display = 'none';
        document.getElementById('loading').style.display = 'block';

        // EPIC 6 - Tâche 3 : Attente de réception du n° d'autorisation de la banque
        setTimeout(() => {
            const numAuth = 'AUTH-' + Math.floor(Math.random() * 10000);
            alert("Paiement autorisé ! N° d'autorisation de la banque : " + numAuth);
            window.location.href = 'billet.html'; // Redirection vers l'édition du billet
        }, 2500); // Simulation d'une attente de 2.5 secondes
    });
});
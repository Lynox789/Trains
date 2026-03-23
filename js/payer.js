document.addEventListener('DOMContentLoaded', () => {
    // EPIC 6 - Tâche 1: Générer et afficher la référence de réservation
    const reference = 'RES-' + Math.floor(Math.random() * 900000 + 100000);
    document.getElementById('ref-display').textContent = reference;
    localStorage.setItem('current_ref', reference); // Sauvegarde pour le billet

    // Récupérer le prix total depuis le panier
    let total = 0;
    const aller = JSON.parse(localStorage.getItem('panier_aller'));
    const retour = JSON.parse(localStorage.getItem('panier_retour'));
    
    if (aller) total += parseFloat(aller.prix_total || 0);
    if (retour) total += parseFloat(retour.prix_total || 0);
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
        
        document.querySelector('.btn-checkout').style.display = 'none';
        document.getElementById('loading').style.display = 'block';

        // EPIC 6 - Tâche 3 : Attente de réception du n° d'autorisation de la banque
        setTimeout(async () => {
            const numAuth = 'AUTH-' + Math.floor(Math.random() * 10000);
            alert("Paiement autorisé ! N° d'autorisation de la banque : " + numAuth);

            try {
                const user = JSON.parse(localStorage.getItem('user'));
                
                // CORRECTION ICI : Sécurisation de la récupération des données
                // On vérifie plusieurs noms de variables possibles pour éviter le "undefined"
                const departFinal = aller ? (aller.gare_depart || aller.depart || 'Gare Inconnue') : 'Gare Inconnue';
                const arriveeFinal = aller ? (aller.gare_arrivee || aller.arrivee || 'Gare Inconnue') : 'Gare Inconnue';
                const dateFinal = aller ? (aller.date_depart || aller.date || 'Date Inconnue') : 'Date Inconnue';
                const heureFinal = aller ? (aller.heure_depart || aller.heure || 'Heure Inconnue') : 'Heure Inconnue';

                const detailsDuBillet = {
                    reference: reference,
                    depart: departFinal,
                    arrivee: arriveeFinal,
                    date: dateFinal,
                    heure_depart: heureFinal,
                    prix_total: total.toFixed(2)
                };

                const emailSaisi = user ? user.email : "test@trains.fr";

                // Envoi des données au serveur
                const response = await fetch('/api/send-ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user ? user.id : null,
                        email: emailSaisi,
                        billet: detailsDuBillet
                    })
                });

                if (response.ok) {
                    // Si le serveur a bien sauvegardé le billet, on redirige vers le ticket !
                    window.location.href = 'billet.html'; 
                } else {
                    const erreurData = await response.json();
                    console.error("Détails erreur serveur :", erreurData);
                    alert("Erreur lors de la sauvegarde du billet.");
                    // Réaffichage des boutons si erreur
                    document.querySelector('.btn-payer').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                }

            } catch (erreur) {
                console.error("Erreur serveur :", erreur);
                alert("Erreur lors de la connexion au serveur.");
            }
            
        }, 2500); 
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // EPIC 6 - Tâche 1: Générer et afficher la référence de réservation
    const reference = 'RES-' + Math.floor(Math.random() * 900000 + 100000);
    document.getElementById('ref-display').textContent = reference;
    localStorage.setItem('current_ref', reference); // Sauvegarde pour le billet

    // Calcul du prix total (aller + retour éventuel)
    let total = 0;
    const aller  = JSON.parse(localStorage.getItem('panier_aller')  || 'null');
    const retour = JSON.parse(localStorage.getItem('panier_retour') || 'null');
    if (aller)  total += parseFloat(aller.prix_total  || 0);
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
                const user      = JSON.parse(localStorage.getItem('user') || 'null');
                const voyageurs = JSON.parse(localStorage.getItem('voyageurs') || '[]');
                const places    = JSON.parse(localStorage.getItem('places_choisies') || 'null');
 
                // ── Construire les billets 
                const billets = [];
                if (aller) {
                    billets.push({
                        num_billet:          'BIL-' + Date.now() + '-A',
                        ref_train_id:        aller.id || aller._id || '',
                        gare_depart:         aller.depart  || aller.gare_depart  || '—',
                        gare_arrivee:        aller.arrivee || aller.gare_arrivee || '—',
                        date_heure_depart:   (aller.date || aller.date_depart || '') + 'T' + (aller.heure_depart || '00:00'),
                        date_heure_arrivee:  (aller.date || aller.date_depart || '') + 'T' + (aller.heure_arrivee || '00:00'),
                        prix_base:           aller.prix_base || 0,
                        voiture:             places?.voiture || 1,
                        places_choisies:     places?.places  || [],
                        options_choisies:    aller.options
                            ? Object.keys(aller.options).map(k => ({ nom_option: k, prix_option: 0 }))
                            : []
                    });
                }
                if (retour) {
                    billets.push({
                        num_billet:          'BIL-' + Date.now() + '-R',
                        ref_train_id:        retour.id || retour._id || '',
                        gare_depart:         retour.depart  || retour.gare_depart  || '—',
                        gare_arrivee:        retour.arrivee || retour.gare_arrivee || '—',
                        date_heure_depart:   (retour.date || retour.date_depart || '') + 'T' + (retour.heure_depart || '00:00'),
                        date_heure_arrivee:  (retour.date || retour.date_depart || '') + 'T' + (retour.heure_arrivee || '00:00'),
                        prix_base:           retour.prix_base || 0,
                        voiture:             1,
                        places_choisies:     [],
                        options_choisies:    []
                    });
                }
 
                const payload = {
                    userId:    user?.id   || null,
                    email:     user?.email || 'test@trains.fr',
                    billet: {
                        reference,
                        num_reservation: reference,
                        type_trajet:     retour ? 'Aller-Retour' : 'Aller',
                        billets,
                        prix_total:      total,
                        nb_voyageurs:    voyageurs.length || 1,
                        // pour rétrocompatibilité avec le mail
                        depart:          billets[0]?.gare_depart  || '—',
                        arrivee:         billets[0]?.gare_arrivee || '—',
                        date:            aller?.date || aller?.date_depart || '—',
                        heure_depart:    aller?.heure_depart || '—',
                        heure_arrivee:   aller?.heure_arrivee || '—',
                        nom_complet:     user?.nom_complet || '',
                        paiement: {
                            nom_titulaire:    document.getElementById('nom-carte')?.value || '',
                            numero_cb_masque: 'XXXX-XXXX-XXXX-' + (document.getElementById('num-carte')?.value?.slice(-4) || '0000'),
                            num_autorisation: numAuth,
                            date_paiement:    new Date().toISOString()
                        }
                    }
                };
 
                const response = await fetch('/api/send-ticket', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(payload)
                });
 
                if (response.ok) {
                    window.location.href = 'billet.html';
                } else {
                    const errData = await response.json();
                    console.error('Erreur serveur :', errData);
                    alert('Erreur lors de la sauvegarde.');
                    document.querySelector('.btn-checkout').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                }
 
            } catch (err) {
                console.error('Erreur :', err);
                alert('Erreur de connexion au serveur.');
            }
            
        }, 2500); 
    });
});
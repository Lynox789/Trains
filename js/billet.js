let billetsData = []; // données globales du billet affiché

// ── Initialisation
window.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const ref     = localStorage.getItem('current_ref');
    const aller   = JSON.parse(localStorage.getItem('panier_aller')   || 'null');
    const retour  = JSON.parse(localStorage.getItem('panier_retour')  || 'null');
    const places  = JSON.parse(localStorage.getItem('places_choisies')|| 'null');
    const voyageurs = JSON.parse(localStorage.getItem('voyageurs')    || '[]');

    // Afficher le billet de confirmation si on vient du paiement
    if (ref && aller) {
        billetsData.push({
            type:          'Aller',
            reference:     ref,
            gare_depart:   aller.depart  || aller.gare_depart  || '—',
            gare_arrivee:  aller.arrivee || aller.gare_arrivee || '—',
            date:          aller.date    || aller.date_depart  || '—',
            heure_depart:  aller.heure_depart || '—',
            heure_arrivee: aller.heure_arrivee || '—',
            prix_total:    aller.prix_total,
            voiture:       places ? places.voiture : '—',
            places:        places ? places.places.join(', ') : '—',
            nb_voyageurs:  voyageurs.length || 1,
            user_email:    user.email,
            user_nom:      user.nom_complet
        });
    }

    // Ajouter le billet RETOUR
    if (ref && retour && retour.depart) { 
        billetsData.push({
            type:          'Retour',
            reference:     ref,
            gare_depart:   retour.depart  || retour.gare_depart  || '—',
            gare_arrivee:  retour.arrivee || retour.gare_arrivee || '—',
            date:          retour.date    || retour.date_depart  || '—',
            heure_depart:  retour.heure_depart || '—',
            heure_arrivee: retour.heure_arrivee || '—',
            prix_total:    retour.prix_total,
            voiture:       places ? places.voiture : '—',
            places:        places ? places.places.join(', ') : '—',
            nb_voyageurs:  voyageurs.length || 1,
            user_email:    user.email,
            user_nom:      user.nom_complet
        });
    }

    // S'il y a des billets, on les affiche
    if (billetsData.length > 0) {
        document.getElementById('section-billet').style.display = 'block';
        afficherBillets();
    }

    // Charger l'historique
    await chargerHistorique(user.id);
});

// ── Afficher les billets générés en HTML 
function afficherBillets() {
    const container = document.getElementById('tickets-container');
    container.innerHTML = ''; // On vide le conteneur

    // Pour chaque billet (Aller, puis Retour), on crée le HTML
    billetsData.forEach((d, index) => {
        const prixAffiche = parseFloat(d.prix_total).toFixed(2);
        
        const ticketHTML = `
            <div class="ticket-wrapper" style="margin-bottom: 20px;">
                <div class="ticket-header">
                    <div class="ticket-brand">T<span>F</span>T <span style="font-size:0.8rem; margin-left:10px; opacity:0.8;">(${d.type})</span></div>
                    <div class="ticket-ref">${d.reference}</div>
                </div>

                <div class="ticket-body">
                    <div class="ticket-trajet">
                        <div class="ticket-gare">
                            <span class="ticket-heure">${d.heure_depart}</span>
                            <span class="ticket-gare-nom">${d.gare_depart}</span>
                        </div>
                        <div class="ticket-ligne">
                            <div class="ticket-dot"></div>
                            <div class="ticket-bar"></div>
                            <svg class="ticket-train-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 5.5.48 5.9 1H6.1C6.5 4.48 8.49 4 12 4zM6 7h5v3H6V7zm7 0h5v3h-5V7zm-7 5h10v4H6v-4z"/>
                            </svg>
                            <div class="ticket-bar"></div>
                            <div class="ticket-dot"></div>
                        </div>
                        <div class="ticket-gare ticket-gare-right">
                            <span class="ticket-heure">${d.heure_arrivee}</span>
                            <span class="ticket-gare-nom">${d.gare_arrivee}</span>
                        </div>
                    </div>

                    <div class="ticket-infos-grid">
                        <div class="ticket-info-item"><span class="ticket-info-label">Date</span><span class="ticket-info-val">${d.date}</span></div>
                        <div class="ticket-info-item"><span class="ticket-info-label">Voyageurs</span><span class="ticket-info-val">${d.nb_voyageurs} pers.</span></div>
                        <div class="ticket-info-item"><span class="ticket-info-label">Voiture</span><span class="ticket-info-val">${d.voiture !== '—' ? 'Voiture ' + d.voiture : '—'}</span></div>
                        <div class="ticket-info-item"><span class="ticket-info-label">Places</span><span class="ticket-info-val">${d.places}</span></div>
                        <div class="ticket-info-item"><span class="ticket-info-label">Classe</span><span class="ticket-info-val">2e classe</span></div>
                        <div class="ticket-info-item"><span class="ticket-info-label">Prix total</span><span class="ticket-info-val ticket-prix">${prixAffiche} €</span></div>
                    </div>
                </div>

                <div class="ticket-tear">
                    <div class="tear-circle tear-left"></div>
                    <div class="tear-line"></div>
                    <div class="tear-circle tear-right"></div>
                </div>

                <div class="ticket-footer">
                    <div class="ticket-footer-info">
                        <p class="ticket-footer-label">Présentez ce billet à l'embarquement</p>
                        <p class="ticket-footer-sub">Valable uniquement pour le trajet indiqué</p>
                        <div class="ticket-barcode" id="ticket-barcode-${index}"></div>
                    </div>
                    <div class="ticket-qr" id="ticket-qr-${index}"></div>
                </div>
            </div>

            <div class="ticket-actions" style="margin-bottom: 60px;">
                <button class="btn-action-secondary" id="btn-mail-${index}" onclick="envoyerMail(${index})">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    Envoyer par mail
                </button>
                <button class="btn-action-primary" onclick="telechargerPDF(${index})">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    Télécharger le PDF
                </button>
            </div>
        `;
        container.innerHTML += ticketHTML;
    });

    // Une fois injectés, on dessine les codes-barres et les QR codes
    billetsData.forEach((d, index) => {
        genererBarcode(`ticket-barcode-${index}`);
        genererQR(`ticket-qr-${index}`, d.reference);
    });
}

// ── Barcode simulée
function genererBarcode(idContainer) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    container.innerHTML = '';
    const barCount = 60;
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const width = Math.random() > 0.7 ? 3 : Math.random() > 0.5 ? 2 : 1;
        const height = 20 + Math.floor(Math.random() * 20);
        bar.style.cssText = `width:${width}px; height:${height}px;`;
        container.appendChild(bar);
    }
}

// ── QR Code
function genererQR(idContainer, reference) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    container.innerHTML = '';
    new QRCode(container, {
        text:          reference,
        width:         90,
        height:        90,
        colorDark:     '#0F172A',
        colorLight:    '#ffffff',
        correctLevel:  QRCode.CorrectLevel.H
    });
}

// ── Télécharger le PDF 
function telechargerPDF(index) {
    const data = billetsData[index];
    if (!data) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 99] });

    const W = 210, H = 99;

    // Fond blanc
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // Bande gauche colorée
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 48, H, 'F');

    // Logo / nom
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TFT', 24, 22, { align: 'center' });

    doc.setTextColor(0, 212, 255);
    doc.setFontSize(8);
    doc.text('TGV GRANDES LIGNES', 24, 29, { align: 'center' });

    // Référence
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('RÉFÉRENCE', 24, 44, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(data.reference, 24, 51, { align: 'center' });

    // Classe
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('2e CLASSE', 24, 65, { align: 'center' });

    // Prix
    doc.setTextColor(0, 212, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(parseFloat(data.prix_total).toFixed(2) + ' EUR', 24, 80, { align: 'center' });

    // Ligne pointillée de découpe
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(48, 6, 48, H - 6);
    doc.setLineDashPattern([], 0);

    // Semi-cercles découpe
    doc.setFillColor(248, 250, 252);
    doc.circle(48, 12, 5, 'F');
    doc.circle(48, H - 12, 5, 'F');

    // Gare départ
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('DÉPART', 62, 18);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.heure_depart, 62, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const depShort = data.gare_depart.length > 22 ? data.gare_depart.substring(0, 22) + '…' : data.gare_depart;
    doc.text(depShort, 62, 38);

    // Flèche centrale
    doc.setTextColor(0, 212, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('→', 112, 30, { align: 'center' });

    // Gare arrivée
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('ARRIVÉE', 130, 18);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.heure_arrivee, 130, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const arrShort = data.gare_arrivee.length > 22 ? data.gare_arrivee.substring(0, 22) + '…' : data.gare_arrivee;
    doc.text(arrShort, 130, 38);

    // Séparateur horizontal
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(55, 46, W - 8, 46);

    // Infos grille
    const infos = [
        { label: 'DATE',      val: data.date },
        { label: 'VOYAGEURS', val: data.nb_voyageurs + ' pers.' },
        { label: 'VOITURE',   val: data.voiture !== '—' ? 'N°' + data.voiture : '—' },
        { label: 'PLACES',    val: data.places },
    ];
    infos.forEach((info, i) => {
        const x = 62 + i * 36;
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(info.label, x, 54);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(String(info.val), x, 62);
    });

    // Barcode simulée
    doc.setFillColor(15, 23, 42);
    let bx = 55;
    const barHeights = [14,8,14,8,12,8,14,10,12,8,14,8,10,14,8,12,14,8,10,12,14,8,14,10,8];
    barHeights.forEach(bh => {
        const bw = Math.random() > 0.6 ? 2.5 : 1.2;
        doc.rect(bx, H - 6 - bh, bw, bh, 'F');
        bx += bw + (Math.random() > 0.5 ? 2 : 1.2);
    });

    // Pied de page
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Billet valable uniquement pour le trajet indiqué. Non remboursable après départ.', 62, H - 4);

    doc.save(`billet-${data.type}-${data.reference}.pdf`);
}

// ── Envoyer par mail (Mise à jour pour EmailJS via backend)
async function envoyerMail(index) {
    const data = billetsData[index];
    if (!data) return;

    const btn = document.getElementById(`btn-mail-${index}`);
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    try {
        // Adaptation du payload "billet" pour matcher ce que notre backend EmailJS attend
        const billetPayload = {
            reference:    data.reference,
            depart:       data.gare_depart,
            arrivee:      data.gare_arrivee,
            date:         data.date,
            heure_depart: data.heure_depart,
            prix_total:   data.prix_total,
            nom_complet:  data.user_nom
        };

        const res = await fetch('/api/send-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email:  data.user_email,
                billet: billetPayload
            })
        });

        if (res.ok) {
            btn.textContent = ' Mail envoyé !';
            setTimeout(() => {
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> Envoyer par mail';
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (err) {
        btn.textContent = ' Erreur';
        btn.disabled = false;
        console.error(err);
    }
}

// ── Historique des réservations 
async function chargerHistorique(userId) {
    const conteneur = document.getElementById('mes-billets-list');
    try {
        const res          = await fetch(`/api/users/${userId}/reservations`);
        const reservations = await res.json();

        if (!reservations.length) {
            conteneur.innerHTML = '<p style="opacity:0.5;font-size:14px;">Aucune réservation pour le moment.</p>';
            return;
        }

        conteneur.innerHTML = reservations.map(r => {
            const billet = r.trajet_reserve?.billets?.[0] || {};
            const date   = new Date(r.date_achat).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const places = billet.places_choisies?.length ? billet.places_choisies.join(', ') : '—';

            return `
            <div class="billet-item">
                <div class="billet-item-header">
                    <div class="billet-trajet">
                        ${billet.gare_depart || '—'}
                        <span>→</span>
                        ${billet.gare_arrivee || '—'}
                    </div>
                    <span class="billet-price">${parseFloat(r.prix_total || 0).toFixed(2)} €</span>
                </div>
                <div class="billet-item-body">
                    <div class="billet-detail">
                        <span class="billet-detail-label">Référence</span>
                        <span class="billet-ref-badge">${r.num_reservation}</span>
                    </div>
                    <div class="billet-detail">
                        <span class="billet-detail-label">Date voyage</span>
                        <span class="billet-detail-val">${billet.gare_depart ? (billet.date_heure_depart || '—').split('T')[0] : '—'}</span>
                    </div>
                    <div class="billet-detail">
                        <span class="billet-detail-label">Départ</span>
                        <span class="billet-detail-val">${billet.date_heure_depart?.split('T')[1]?.substring(0,5) || '—'}</span>
                    </div>
                    <div class="billet-detail">
                        <span class="billet-detail-label">Places</span>
                        <span class="billet-detail-val">${places}</span>
                    </div>
                    <div class="billet-detail">
                        <span class="billet-detail-label">Type</span>
                        <span class="billet-detail-val">${r.trajet_reserve?.type_trajet || 'Aller'}</span>
                    </div>
                    <div class="billet-detail">
                        <span class="billet-detail-label">Acheté le</span>
                        <span class="billet-detail-val">${date}</span>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        conteneur.innerHTML = '<p style="color:#ef4444;font-size:14px;">Erreur lors du chargement.</p>';
        console.error(err);
    }
}
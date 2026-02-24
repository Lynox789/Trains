function afficherRecap() {
    const container = document.getElementById('recap-final-container');
    const totalSpan = document.getElementById('total-final');
    
    const aller = JSON.parse(localStorage.getItem('panier_aller'));
    const retour = JSON.parse(localStorage.getItem('panier_retour'));
    
    let html = '';
    let totalGlobal = 0;

    const buildSection = (trajet, typeVoyage) => {
        if (!trajet) return '';

        const prixFinal = parseFloat(trajet.prix_total);
        totalGlobal += prixFinal;

        let passagersList = '';
        if (trajet.passagers && trajet.passagers.length > 0) {
            passagersList = trajet.passagers.map(p => {
                const nomAffiche = p.nom && p.nom.trim() !== '' ? p.nom : 'Voyageur';
                return `<li class="passenger-item">
                            <span style="opacity:0.6;">👤</span> 
                            <strong>${nomAffiche}</strong> 
                            <span style="opacity:0.6; font-size:0.9em;">(${p.age} ans)</span>
                        </li>`;
            }).join('');
        } else {
            passagersList = '<li class="passenger-item">1 Voyageur (Standard)</li>';
        }

        let optionsHTML = '';
        if (trajet.options) {
            const optionsArray = [];
            for (const [optName, isSelected] of Object.entries(trajet.options)) {
                if(isSelected) {
                    let cleanName = optName.replace('option_', '').replace(/_/g, ' ');
                    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                    optionsArray.push(cleanName);
                }
            }
            
            if (optionsArray.length > 0) {
                optionsHTML = `<div class="detail-group">
                                <div class="detail-label">Options choisies</div>
                                <div class="options-container">
                                    ${optionsArray.map(opt => `<span class="option-badge">${opt}</span>`).join('')}
                                </div>
                               </div>`;
            } else {
                optionsHTML = `<div class="detail-group">
                                <div class="detail-label">Options</div>
                                <span style="font-size:0.9rem; opacity:0.5; font-style:italic;">Aucune option sélectionnée</span>
                               </div>`;
            }
        }

        return `
            <div class="recap-card">
                <div class="recap-header">
                    <span class="recap-type">${typeVoyage}</span>
                    <span class="recap-date">${trajet.date || trajet.date_depart}</span>
                </div>
                
                <div class="recap-body">
                    <div class="recap-route">
                        ${trajet.depart || trajet.gare_depart} 
                        <span class="arrow-icon">➔</span> 
                        ${trajet.arrivee || trajet.gare_arrivee}
                    </div>

                    <div class="recap-details-box">
                        <div class="detail-group">
                            <div class="detail-label">Passagers</div>
                            <ul class="passenger-list">
                                ${passagersList}
                            </ul>
                        </div>
                        
                        ${optionsHTML ? '<hr style="border:0; border-top:1px solid rgba(255,255,255,0.05); margin:15px 0;">' : ''}
                        
                        ${optionsHTML}
                    </div>
                </div>

                <div class="recap-footer">
                    <div class="recap-price">${prixFinal.toFixed(2)} €</div>
                </div>
            </div>`;
    };

    html += buildSection(aller, 'Trajet Aller');
    html += buildSection(retour, 'Trajet Retour');

    container.innerHTML = html || '<p style="text-align:center; padding:50px; opacity:0.7;">Aucun trajet trouvé dans le panier.</p>';
    totalSpan.textContent = totalGlobal.toFixed(2);
}

document.addEventListener('DOMContentLoaded', afficherRecap);
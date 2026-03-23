
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Gère les deux boutons (navbar + menu mobile)
    ['btn-auth', 'btn-auth-mobile'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;

        if (user) {
            btn.innerHTML = `${user.nom_complet} | Déconnexion`;
            btn.className = "btn-logout";
            btn.addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.reload();
            });
        } else {
            btn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    });
});

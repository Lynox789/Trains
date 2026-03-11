document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('cyber-toggle');
    const body = document.body;

    if (!themeCheckbox) return; // Sécurité

    // Au chargement : on vérifie la mémoire
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Application du bon thème au chargement
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        themeCheckbox.checked = true; // OFF = Mode clair
    } else {
        body.classList.remove('light-mode');
        themeCheckbox.checked = false;  // ON = Mode sombre
    }

    // Action quand on clique sur le bouton
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    });
});
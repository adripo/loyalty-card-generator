/**
 * Theme management for the loyalty card generator
 */

// Apply theme immediately to prevent flash
(function() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'auto';
    
    if (savedTheme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', systemTheme);
    } else {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
})();

// Theme handling
function setTheme(theme) {
    localStorage.setItem('preferredTheme', theme);
    
    // Add transition class to body before changing theme
    document.body.classList.add('theme-transition');
    
    if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', systemTheme);
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }
    
    // Remove transition class after animation completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 300);
}

function initTheme() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'auto';
    $(`#theme-${savedTheme}`).prop('checked', true);
    // No need to call setTheme again as it's already applied in the IIFE
}

// Theme switch listeners
function setupThemeListeners() {
    $('input[name="theme"]').on('change', function () {
        setTheme($(this).val());
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('preferredTheme') === 'auto') {
            setTheme('auto');
        }
    });
}

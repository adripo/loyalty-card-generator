/**
 * Theme management for the loyalty card generator
 */

// Theme handling
function setTheme(theme) {
    localStorage.setItem('preferredTheme', theme);
    if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', systemTheme);
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'auto';
    $(`#theme-${savedTheme}`).prop('checked', true);
    setTheme(savedTheme);
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

/**
 * Color utilities for the loyalty card generator
 */

// Function to convert HSL color to HEX
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Function to generate pastel color in hex
function generatePastelColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70; // Fixed for pastel
    const lightness = 85; // Fixed for pastel
    return hslToHex(hue, saturation, lightness);
}

// Function to apply color or random colors to all cards
function applyColorToAll(action, color) {
    if (cards.length === 0) return;

    if (action === 'custom') {
        // Create a temporary color input
        const input = document.createElement('input');
        input.type = 'color';

        // When color is selected, apply to all cards
        input.addEventListener('change', function () {
            cards.forEach(card => {
                card.backgroundColor = this.value;
            });
            renderCards();
        });

        // Trigger click to open color picker
        input.click();
    } else {
        cards.forEach(card => {
            if (action === 'random') {
                card.backgroundColor = generatePastelColor();
            } else {
                card.backgroundColor = color;
            }
        });

        // Re-render to update UI
        renderCards();
    }
}

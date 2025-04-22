/**
 * Main application logic for Loyalty Card Generator
 */

// Global variables
let cardWidth = 512;
let cardHeight = Math.round(cardWidth / 1.585);
let logoSize = 90; // percent
const cards = [];

$(document).ready(function() {
    // Initialize theme
    initTheme();
    setupThemeListeners();
    
    // Initialize dimensions display
    $('#dimensions-display').text(`${cardWidth} × ${cardHeight} px`);
    
    // Event Listeners
    
    // File button click
    $('#file-button').on('click', function() {
        $('#file-input').click();
    });
    
    // File input change
    $('#file-input').on('change', function(e) {
        handleFiles(e.target.files);
        // Reset the input to allow uploading the same file again
        this.value = '';
    });
    
    // Card width change - only update on blur or Enter key
    $('#card-width').on('blur', updateCardDimensions);
    $('#card-width').on('keydown', function(e) {
        if (e.key === 'Enter') {
            updateCardDimensions();
            e.preventDefault(); // Prevent form submission
        }
    });
    
    // Logo size change
    $('#logo-size').on('input', updateLogoSize);
    
    // Color preset click
    $('.color-preset').on('click', function() {
        if ($(this).data('action') === 'random') {
            applyColorToAll('random');
        } else {
            const color = $(this).data('color');
            applyColorToAll('color', color);
        }
    });
    
    // Download all button
    $('#download-all').on('click', downloadAllCards);
    
    // Clear all button
    $('#clear-all').on('click', function() {
        if (cards.length === 0) return;
        
        if (confirm('Are you sure you want to clear all cards?')) {
            cards.length = 0;
            renderCards();
        }
    });
    
    // Set up drag and drop
    setupDragAndDrop();
    
    // Initial render
    renderCards();
});

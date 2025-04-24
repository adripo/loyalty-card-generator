/**
 * Main application logic for Loyalty Card Generator
 */

// Global variables
let cardWidth = 512; // Default card width in pixels
let cardHeight = Math.round(cardWidth / 1.585); // Maintain credit card aspect ratio
let logoSize = 90; // percent
const cards = [];
let isDraggingFile = false;

// Card dimensions in mm (fixed)
const CARD_WIDTH_MM = 85.60;
const CARD_HEIGHT_MM = 53.98;

$(document).ready(function () {
    // Initialize theme
    initTheme();
    setupThemeListeners();

    // Initialize dimensions display with both pixels and mm
    updateDimensionsDisplay();

    // Event Listeners
    // File button click
    $('#file-button').on('click', function () {
        $('#file-input').click();
    });

    // File input change
    $('#file-input').on('change', function (e) {
        handleFiles(e.target.files);
        // Reset the input to allow uploading the same file again
        this.value = '';
    });

    // Card width change - only update on blur or Enter key
    $('#card-width').on('blur', updateCardDimensions);
    $('#card-width').on('keydown', function (e) {
        if (e.key === 'Enter') {
            updateCardDimensions();
            e.preventDefault(); // Prevent form submission
        }
    });

    // Logo size change - allow any value between 50-100
    $('#logo-size').on('input', function () {
        logoSize = parseInt($(this).val());
        if (isNaN(logoSize) || logoSize < 50) {
            logoSize = 50;
            $(this).val(50);
        } else if (logoSize > 100) {
            logoSize = 100;
            $(this).val(100);
        }
        $('#logo-size-display').text(`${logoSize}%`);
        
        // Update cards
        renderCards();
    });

    // Slider ticks for quick selection
    $('.slider-tick').on('click', function() {
        const value = $(this).data('value');
        $('#logo-size').val(value).trigger('input');
    });

    // Color preset click
    $('.color-preset').on('click', function () {
        const $button = $(this);
        const action = $button.data('action');
        
        if (action === 'random') {
            applyColorToAll('random');
        } else if (action === 'custom') {
            // Open color picker directly
            const $picker = $('#color-picker-container');
            const initialColor = '#ffffff';
            
            // Position the picker near the button
            const buttonOffset = $button.offset();
            $picker.css({
                top: buttonOffset.top + $button.outerHeight() + 5,
                left: buttonOffset.left
            }).show();
            
            // Set initial color
            $picker.find('.color-picker-input').val(initialColor);
            
            // Set up the cancel button
            $picker.find('.color-picker-cancel, .color-picker-close').off('click').on('click', function() {
                $picker.hide();
            });
            
            // Set up the apply button
            $picker.find('.color-picker-apply').off('click').on('click', function() {
                const color = $picker.find('.color-picker-input').val();
                $picker.hide();
                applyColorToAll('color', color);
            });
            
            // Close when clicking outside
            $(document).on('mousedown.colorPicker', function(e) {
                if (!$picker.is(e.target) && $picker.has(e.target).length === 0 && !$button.is(e.target)) {
                    $picker.hide();
                    $(document).off('mousedown.colorPicker');
                }
            });
        } else {
            const color = $button.data('color');
            applyColorToAll('color', color);
        }
    });

    // Download all button
    $('#download-all').on('click', downloadAllCards);

    // Clear all button
    $('#clear-all').on('click', function () {
        if (cards.length === 0) return;
        if (confirm('Are you sure you want to clear all cards?')) {
            cards.length = 0;
            renderCards();
        }
    });

    // Set up drag and drop
    setupDragAndDrop();
    setupFullPageDragDrop();

    // Initial render
    renderCards();
});

/**
 * Updates the displayed dimensions based on card width in pixels
 * Shows both pixel dimensions and fixed mm dimensions
 */
function updateDimensionsDisplay() {
    cardHeight = Math.round(cardWidth / 1.585);
    $('#dimensions-display').text(`${cardWidth} × ${cardHeight} px`);
}

/**
 * Updates card dimensions based on the width input
 */
function updateCardDimensions() {
    const inputWidth = parseInt($('#card-width').val());
    
    // Validate width
    if (isNaN(inputWidth) || inputWidth < 100) {
        cardWidth = 100;
        $('#card-width').val(100);
    } else if (inputWidth > 2000) {
        cardWidth = 2000;
        $('#card-width').val(2000);
    } else {
        cardWidth = inputWidth;
    }
    
    updateDimensionsDisplay();
    renderCards();
}

/**
 * Sets up enhanced drag and drop on the entire page
 * With visual connection to Upload Logos section
 */
function setupFullPageDragDrop() {
    const body = document.body;
    const fullPageDrop = document.getElementById('full-page-drop');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Show full-page drop indicator when dragging over the page
    ['dragenter', 'dragover'].forEach(eventName => {
        body.addEventListener(eventName, function(e) {
            if (!isDraggingFile) {
                const types = e.dataTransfer.types;
                if (types && types.includes('Files')) {
                    isDraggingFile = true;
                    fullPageDrop.classList.remove('d-none');
                    
                    // Highlight the upload section to connect visually
                    document.getElementById('drop-area').classList.add('highlight');
                }
            }
        }, false);
    });
    
    // Hide full-page drop indicator
    ['dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, function(e) {
            // Only hide if leaving the body (not entering a child)
            if (e.target === body || e.target === fullPageDrop) {
                if (eventName === 'dragleave' && e.relatedTarget && body.contains(e.relatedTarget)) {
                    return; // Don't hide when moving to a child
                }
                isDraggingFile = false;
                fullPageDrop.classList.add('d-none');
                
                // Remove highlight from upload section
                document.getElementById('drop-area').classList.remove('highlight');
            }
        }, false);
    });
    
    // Handle file drop
    fullPageDrop.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        isDraggingFile = false;
        fullPageDrop.classList.add('d-none');
        
        // Remove highlight from upload section
        document.getElementById('drop-area').classList.remove('highlight');
    }, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

/**
 * Opens a color picker at the specified element
 * @param {jQuery} $trigger - The element that triggered the color picker
 * @param {Function} callback - Function to call when a color is selected
 */
function openColorPicker($trigger, callback) {
    const $picker = $('#color-picker-container');
    const triggerOffset = $trigger.offset();
    
    // Position the picker near the trigger
    $picker.css({
        top: triggerOffset.top + $trigger.outerHeight() + 5,
        left: triggerOffset.left
    }).show();
    
    // Set initial color if the trigger has one
    const initialColor = $trigger.data('color') || '#ffffff';
    const $colorInput = $picker.find('.color-picker-input');
    $colorInput.val(initialColor);
    
    // Open the color picker directly
    setTimeout(() => {
        $colorInput[0].click();
    }, 50);
    
    // Set up the cancel button
    $picker.find('.color-picker-cancel, .color-picker-close').off('click').on('click', function() {
        $picker.hide();
    });
    
    // Set up the apply button
    $picker.find('.color-picker-apply').off('click').on('click', function() {
        const color = $colorInput.val();
        $picker.hide();
        if (callback) callback(color);
    });
    
    // Close when clicking outside
    $(document).on('mousedown.colorPicker', function(e) {
        if (!$picker.is(e.target) && $picker.has(e.target).length === 0 && !$trigger.is(e.target)) {
            $picker.hide();
            $(document).off('mousedown.colorPicker');
        }
    });
}


/**
 * Card manipulation utilities
 */

// Function to update card dimensions
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
    
    cardHeight = Math.round(cardWidth / 1.585);
    $('#dimensions-display').text(`${cardWidth} × ${cardHeight} px`);
    
    $('.loyalty-card').css('max-width', `${cardWidth}px`);
    
    // Update card images if needed
    renderCards();
}

// Function to update logo size
function updateLogoSize() {
    logoSize = $('#logo-size').val();
    $('#logo-size-display').text(`${logoSize}%`);
    $('.loyalty-card img').css({
        'max-width': `${logoSize}%`,
        'max-height': `${logoSize}%`
    });
}

// Function to update card counter
function updateCardCounter() {
    $('#card-counter').text(cards.length);
    
    // Show/hide empty state
    if (cards.length > 0) {
        $('#empty-state').hide();
    } else {
        $('#empty-state').show();
    }
}

// Function to create a card
function createCard(logoFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const backgroundColor = generatePastelColor();
            
            // Check image dimensions
            const img = new Image();
            img.onload = function() {
                const card = {
                    logo: e.target.result,
                    backgroundColor: backgroundColor,
                    filename: logoFile.name,
                    width: img.width,
                    height: img.height,
                    needsScaling: img.width < cardWidth || img.height < cardHeight
                };
                
                cards.push(card);
                resolve(card);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(logoFile);
    });
}

// Function to render all cards
function renderCards() {
    const container = $('#cards-container');
    container.empty();
    
    if (cards.length === 0) {
        container.append(`
            <div id="empty-state" class="empty-state">
                <i class="bi bi-card-image fs-1 mb-3"></i>
                <p>Upload logos to generate cards</p>
            </div>
        `);
        updateCardCounter();
        return;
    }
    
    cards.forEach((card, index) => {
        // Set up warning for scaled images
        const warningElement = card.needsScaling ? 
            `<div class="image-warning">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <div class="tooltip-content">Low resolution image (original: ${card.width}×${card.height}px)</div>
            </div>` : '';
        
        const cardElement = $(`
            <div class="col-md-4 card-item">
                <div class="card-header">
                    Card #${index + 1}: ${card.filename}
                </div>
                <div class="loyalty-card">
                    <div class="loyalty-card-inner" style="background-color: ${card.backgroundColor}">
                        <img src="${card.logo}" alt="Logo" style="max-width: ${logoSize}%; max-height: ${logoSize}%;">
                        ${warningElement}
                    </div>
                </div>
                <div class="card-controls">
                    <input type="color" class="color-picker" value="${card.backgroundColor}" data-index="${index}" title="Change background color">
                    <button class="btn btn-sm btn-secondary random-color" data-index="${index}">
                        <i class="bi bi-shuffle"></i> Random
                    </button>
                    <button class="btn btn-sm btn-success download-card" data-index="${index}">
                        <i class="bi bi-download"></i> Download
                    </button>
                    <button class="btn btn-sm btn-danger remove-card" data-index="${index}">
                        <i class="bi bi-trash"></i> Remove
                    </button>
                </div>
            </div>
        `);
        
        container.append(cardElement);
    });
    
    // Attach event listeners to controls
    attachControlListeners();
    
    // Update card counter
    updateCardCounter();
}

// Function to attach event listeners to card controls
function attachControlListeners() {
    // Color picker change
    $('.color-picker').on('change', function() {
        const index = $(this).data('index');
        const newColor = $(this).val();
        cards[index].backgroundColor = newColor;
        $(this).closest('.card-item').find('.loyalty-card-inner').css('background-color', newColor);
    });
    
    // Random color button
    $('.random-color').on('click', function() {
        const index = $(this).data('index');
        const newColor = generatePastelColor();
        cards[index].backgroundColor = newColor;
        
        const $cardItem = $(this).closest('.card-item');
        $cardItem.find('.loyalty-card-inner').css('background-color', newColor);
        $cardItem.find('.color-picker').val(newColor);
    });
    
    // Download single card button
    $('.download-card').on('click', function() {
        const index = $(this).data('index');
        downloadSingleCard(index);
    });
    
    // Remove card button
    $('.remove-card').on('click', function() {
        const index = $(this).data('index');
        cards.splice(index, 1);
        renderCards();
    });
}

// Function to calculate and draw the logo on canvas to match preview
function drawLogoOnCanvas(ctx, logoImg, cardWidth, cardHeight, logoSize) {
    // Calculate dimensions to maintain aspect ratio with margins
    const margin = cardWidth * (100 - logoSize) / 200; // Calculate margin based on logo size
    const maxWidth = cardWidth - (margin * 2);
    const maxHeight = cardHeight - (margin * 2);
    
    let logoWidth = logoImg.width;
    let logoHeight = logoImg.height;
    
    // Scale down if the logo is too large
    if (logoWidth > maxWidth || logoHeight > maxHeight) {
        const widthRatio = maxWidth / logoWidth;
        const heightRatio = maxHeight / logoHeight;
        const scaleRatio = Math.min(widthRatio, heightRatio);
        
        logoWidth *= scaleRatio;
        logoHeight *= scaleRatio;
    }
    
    // Draw the logo centered on the card
    const x = (cardWidth - logoWidth) / 2;
    const y = (cardHeight - logoHeight) / 2;
    ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
}

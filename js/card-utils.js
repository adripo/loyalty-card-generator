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
    logoSize = parseInt($('#logo-size').val());
    $('#logo-size-display').text(`${logoSize}%`);

    // Update all cards that don't have individual size set
    $('.loyalty-card img').each(function (index) {
        if (!cards[index] || !cards[index].individualLogoSize) {
            $(this).css({
                'max-width': `${logoSize}%`,
                'max-height': `${logoSize}%`
            });
        }
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

        reader.onload = function (e) {
            const backgroundColor = generatePastelColor();

            // Check image dimensions
            const img = new Image();
            img.onload = function () {
                const card = {
                    logo: e.target.result,
                    backgroundColor: backgroundColor,
                    filename: logoFile.name,
                    width: img.width,
                    height: img.height,
                    needsScaling: img.width < cardWidth || img.height < cardHeight,
                    individualLogoSize: logoSize // Store individual logo size
                };

                cards.push(card);
                resolve(card);
            };

            img.onerror = function () {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target.result;
        };

        reader.onerror = function () {
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

    // Generate ticks for slider
    const sliderTicks = Array.from({ length: 6 }, (_, i) => {
        const value = 50 + (i * 10);
        return `<li class="slider-tick">${value % 20 === 0 ? `<span class="slider-tick-label">${value}</span>` : ''}</li>`;
    }).join('');

    cards.forEach((card, index) => {
        // Set up warning for scaled images
        const warningElement = card.needsScaling ?
            `<div class="image-warning">
                <div class="image-warning-icon">
                    <i class="bi bi-exclamation-fill"></i>
                </div>
                <div class="tooltip-content">
                    Low resolution image (original: ${card.width}×${card.height}px)
                </div>
            </div>` : '';

        // Ensure individual logo size is set
        card.individualLogoSize = card.individualLogoSize || logoSize;

        const cardElement = $(`
            <div class="col-md-4 card-item mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-header bg-transparent d-flex align-items-center p-2 ps-3">
                        <div class="text-truncate" title="${card.filename}">${card.filename}</div>
                        <div class="ms-auto">
                            <span class="badge bg-secondary">#${index + 1}</span>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="loyalty-card m-0 w-100">
                            <div class="loyalty-card-inner" style="background-color: ${card.backgroundColor}">
                                <img src="${card.logo}" alt="Logo" style="max-width: ${card.individualLogoSize}%; max-height: ${card.individualLogoSize}%;">
                                ${warningElement}
                            </div>
                        </div>
                    </div>
                    <div class="card-controls">
                        <div class="slider-container w-100">
                            <div class="slider-header">
                                <label class="form-label mb-0 small">Logo Size</label>
                                <span class="slider-value logo-size-display">${card.individualLogoSize}%</span>
                            </div>
                            <input type="range" class="form-range card-logo-size" 
                                   min="50" max="100" step="10" value="${card.individualLogoSize}" 
                                   data-index="${index}">
                            <ul class="slider-ticks">
                                ${sliderTicks}
                            </ul>
                        </div>
                        
                        <div class="d-flex justify-content-between w-100 align-items-center">
                            <div class="color-control-group">
                                <input type="color" class="color-picker" 
                                       value="${card.backgroundColor}" data-index="${index}" 
                                       title="Change background color">
                                <button class="btn btn-sm random-color" data-index="${index}" 
                                        title="Random color">
                                    <i class="bi bi-shuffle"></i>
                                </button>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-outline-success card-action-btn download-card" 
                                        data-index="${index}">
                                    <i class="bi bi-download"></i> Download
                                </button>
                                <button class="btn btn-sm btn-outline-danger card-action-btn remove-card" 
                                        data-index="${index}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
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
    $('.color-picker').on('change', function () {
        const index = $(this).data('index');
        const newColor = $(this).val();
        cards[index].backgroundColor = newColor;
        $(this).closest('.card-item').find('.loyalty-card-inner').css('background-color', newColor);
    });

    // Random color button
    $('.random-color').on('click', function () {
        const index = $(this).data('index');
        const newColor = generatePastelColor();
        cards[index].backgroundColor = newColor;

        const $cardItem = $(this).closest('.card-item');
        $cardItem.find('.loyalty-card-inner').css('background-color', newColor);
        $cardItem.find('.color-picker').val(newColor);
    });

    // Individual logo size slider
    $('.card-logo-size').on('input', function () {
        const index = $(this).data('index');
        const newSize = parseInt($(this).val());

        // Update the card object
        cards[index].individualLogoSize = newSize;

        // Update UI
        const $cardItem = $(this).closest('.card-item');
        $cardItem.find('.logo-size-display').text(`${newSize}%`);
        $cardItem.find('.loyalty-card img').css({
            'max-width': `${newSize}%`,
            'max-height': `${newSize}%`
        });
    });

    // Download single card button
    $('.download-card').on('click', function () {
        const index = $(this).data('index');
        downloadSingleCard(index);
    });

    // Remove card button
    $('.remove-card').on('click', function () {
        const index = $(this).data('index');
        if (confirm('Are you sure you want to remove this card?')) {
            cards.splice(index, 1);
            renderCards();
        }
    });
}

// Function to process and draw the logo on canvas, removing transparent borders
function processAndDrawLogo(ctx, logoImg, cardWidth, cardHeight, logoSize) {
    // Create a temporary canvas to analyze the image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = logoImg.width;
    tempCanvas.height = logoImg.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the image to the temporary canvas
    tempCtx.drawImage(logoImg, 0, 0);

    // Get image data to analyze transparent borders
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Find the bounds of non-transparent pixels
    let minX = tempCanvas.width;
    let minY = tempCanvas.height;
    let maxX = 0;
    let maxY = 0;
    let hasTransparency = false;

    // Scan the image data to find non-transparent pixels
    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const alpha = data[((y * tempCanvas.width) + x) * 4 + 3];
            if (alpha > 0) { // If not fully transparent
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            if (alpha < 255) {
                hasTransparency = true;
            }
        }
    }

    // Check if we found any non-transparent pixels and if there's transparency
    if (hasTransparency && minX <= maxX && minY <= maxY) {
        // Calculate the trimmed dimensions
        const trimmedWidth = maxX - minX + 1;
        const trimmedHeight = maxY - minY + 1;

        // Create another canvas for the trimmed image
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimmedWidth;
        trimmedCanvas.height = trimmedHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');

        // Draw the trimmed image
        trimmedCtx.drawImage(
            logoImg,
            minX, minY, trimmedWidth, trimmedHeight,
            0, 0, trimmedWidth, trimmedHeight
        );

        // Now draw this trimmed image to the output canvas
        // Calculate dimensions to maintain aspect ratio with margins
        const margin = cardWidth * (100 - logoSize) / 200; // Calculate margin based on logo size
        const maxWidth = cardWidth - (margin * 2);
        const maxHeight = cardHeight - (margin * 2);

        let logoWidth = trimmedWidth;
        let logoHeight = trimmedHeight;

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
        ctx.drawImage(trimmedCanvas, x, y, logoWidth, logoHeight);
    } else {
        // No transparency or no visible content - use original image
        // Calculate dimensions to maintain aspect ratio with margins
        const margin = cardWidth * (100 - logoSize) / 200;
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
}

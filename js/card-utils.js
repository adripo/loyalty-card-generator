/**
 * Card manipulation utilities
 */

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
                    individualLogoSize: null, // Use global logo size by default
                    isSvg: logoFile.type === 'image/svg+xml'
                };

                // If it's not an SVG, process to remove transparent areas
                if (!card.isSvg) {
                    trimTransparentAreas(img, card).then(trimmedCard => {
                        cards.push(trimmedCard);
                        resolve(trimmedCard);
                    }).catch(err => {
                        console.warn('Could not trim transparent areas:', err);
                        cards.push(card);
                        resolve(card);
                    });
                } else {
                    cards.push(card);
                    resolve(card);
                }
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

// Function to trim transparent areas around an image
function trimTransparentAreas(img, card) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Find the boundaries
            let minX = canvas.width;
            let minY = canvas.height;
            let maxX = 0;
            let maxY = 0;

            // Scan the image data to find non-transparent pixels
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alpha = data[((y * canvas.width + x) * 4) + 3];
                    if (alpha > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // If we found non-transparent pixels
            if (minX < maxX && minY < maxY) {
                // Add a small padding
                const padding = 10;
                minX = Math.max(0, minX - padding);
                minY = Math.max(0, minY - padding);
                maxX = Math.min(canvas.width, maxX + padding);
                maxY = Math.min(canvas.height, maxY + padding);

                // Create a new canvas with the trimmed dimensions
                const trimmedCanvas = document.createElement('canvas');
                const trimmedWidth = maxX - minX;
                const trimmedHeight = maxY - minY;

                // If the trimmed area is too small or the entire image, don't trim
                if (trimmedWidth < 10 || trimmedHeight < 10 ||
                    (trimmedWidth >= canvas.width - 20 && trimmedHeight >= canvas.height - 20)) {
                    resolve(card);
                    return;
                }

                trimmedCanvas.width = trimmedWidth;
                trimmedCanvas.height = trimmedHeight;

                // Draw the trimmed image
                const trimmedCtx = trimmedCanvas.getContext('2d');
                trimmedCtx.drawImage(img, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

                // Update the card with the trimmed image
                const trimmedCard = { ...card };
                trimmedCard.logo = trimmedCanvas.toDataURL();
                trimmedCard.width = trimmedWidth;
                trimmedCard.height = trimmedHeight;

                resolve(trimmedCard);
            } else {
                // No non-transparent pixels found or the entire image is used
                resolve(card);
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Function to render all cards
function renderCards() {
    const container = $('#cards-container');
    container.empty();

    if (cards.length === 0) {
        container.append(`
            <div id="empty-state" class="empty-state">
                <i class="bi bi-image mb-3" style="font-size: 2rem;"></i>
                <p>Upload logos to generate cards</p>
            </div>
        `);
        updateCardCounter();
        return;
    }

    cards.forEach((card, index) => {
        // Apply current global logo size if no individual size set
        const effectiveLogoSize = card.individualLogoSize !== null ? card.individualLogoSize : logoSize;

        // Create card element
        const cardElement = $(`
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="loyalty-card" style="width: ${cardWidth}px; max-width: 100%;">
                        <div class="loyalty-card-inner" style="background-color: ${card.backgroundColor};">
                            <img src="${card.logo}" alt="Logo" style="width: ${effectiveLogoSize}%; max-height: ${effectiveLogoSize}%; object-fit: contain;">
                            ${(!card.isSvg && card.needsScaling) ? `
                                <div class="image-warning">
                                    <div class="image-warning-icon">!</div>
                                    <div class="tooltip-content">
                                        Image resolution is low and may appear pixelated when printed.
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-truncate">
                            <i class="bi bi-file-image"></i> ${card.filename}
                        </p>
                    </div>
                    <div class="logo-size-control">
                        <div class="slim-size-display">
                            <span class="size-icon"><i class="bi bi-arrows-angle-expand"></i></span>
                            <span class="size-value">${effectiveLogoSize}%</span>
                        </div>
                        <input type="range" class="logo-size-slider form-range thin-slider" 
                                min="50" max="100" value="${effectiveLogoSize}" 
                                data-card-index="${index}">
                        <button class="reset-size" title="Reset to global size" data-card-index="${index}">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                    </div>
                    <div class="card-controls">
                        <div class="color-control-group">
                            <button class="color-picker" title="Change card color" data-card-index="${index}" 
                                    data-color="${card.backgroundColor}" style="background-color: ${card.backgroundColor};">
                                <span class="visually-hidden">Change color</span>
                            </button>
                            <button class="btn btn-sm random-color" title="Random color" data-card-index="${index}">
                                <i class="bi bi-shuffle"></i>
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary card-action-btn" title="Download card" data-action="download" data-card-index="${index}">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger card-action-btn" title="Remove card" data-action="remove" data-card-index="${index}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Add event listeners for card controls
        // Individual logo size control
        cardElement.find('.logo-size-slider').on('input', function() {
            const value = parseInt($(this).val());
            const cardIndex = $(this).data('card-index');
            
            // Update the display value
            $(this).siblings('.logo-size-value').text(`${value}%`);
            
            // Update the card when slider is moved
            cards[cardIndex].individualLogoSize = value;
            
            // Update just this card's image without re-rendering all cards
            const cardImg = $(this).closest('.card').find('.loyalty-card-inner img');
            cardImg.css({
                'width': `${value}%`,
                'max-height': `${value}%`
            });
        });

        // Reset button for logo size
        cardElement.find('.reset-size').on('click', function () {
            const cardIndex = $(this).data('card-index');
            cards[cardIndex].individualLogoSize = null;
            renderCards();
        });

        // Color picker
        cardElement.find('.color-picker').on('click', function (e) {
            e.preventDefault();
            const $picker = $(this);
            const cardIndex = $picker.data('card-index');

            openColorPicker($picker, function (color) {
                cards[cardIndex].backgroundColor = color;
                renderCards();
            });
        });

        // Random color button
        cardElement.find('.random-color').on('click', function () {
            const cardIndex = $(this).data('card-index');
            cards[cardIndex].backgroundColor = generatePastelColor();
            renderCards();
        });

        // Action buttons (download, remove)
        cardElement.find('.card-action-btn').on('click', function () {
            const action = $(this).data('action');
            const cardIndex = $(this).data('card-index');

            if (action === 'download') {
                downloadCard(cardIndex);
            } else if (action === 'remove') {
                // Remove without confirmation
                cards.splice(cardIndex, 1);
                renderCards();
            }
        });

        container.append(cardElement);
    });

    updateCardCounter();
}

// Function to update card counter
function updateCardCounter() {
    $('#card-counter').text(cards.length);

    // Show/hide empty state and enable/disable buttons
    if (cards.length > 0) {
        $('#empty-state').hide();
        $('#download-all, #clear-all').prop('disabled', false);
    } else {
        $('#empty-state').show();
        $('#download-all, #clear-all').prop('disabled', true);
    }
}

// Function to download a single card
function downloadCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= cards.length) return;

    const card = cards[cardIndex];
    renderCardToImage(card).then(imageUrl => {
        const link = document.createElement('a');

        // Get filename prefix or use default
        const prefix = $('#filename-prefix').val().trim() || 'loyalty-card';

        // Generate filename from original file
        const filenameParts = card.filename.split('.');
        filenameParts.pop(); // Remove extension
        const cleanedFilename = filenameParts.join('.').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        link.download = `${prefix}-${cleanedFilename}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(error => {
        console.error('Error generating card image:', error);
        alert('Failed to generate card image. Please try again.');
    });
}

// Function to download all cards as ZIP
function downloadAllCards() {
    if (cards.length === 0) return;

    // Ask for confirmation if there are many cards
    if (cards.length > 10 && !confirm(`You are about to download ${cards.length} cards. Continue?`)) {
        return;
    }

    // Load JSZip library dynamically
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
        .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'))
        .then(() => {
            // Create a new ZIP instance
            const zip = new JSZip();

            // Show progress indicator
            const progressModal = $(`
                <div class="modal fade" id="download-progress-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Preparing ZIP File</h5>
                            </div>
                            <div class="modal-body text-center">
                                <div class="progress mb-3">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p id="download-progress-text">Processing cards...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            $('body').append(progressModal);
            const modal = new bootstrap.Modal(document.getElementById('download-progress-modal'));
            modal.show();

            // Get filename prefix
            const prefix = $('#filename-prefix').val().trim() || 'loyalty-card';

            // Process all cards and add to ZIP
            const promises = cards.map((card, index) => {
                return new Promise((resolve, reject) => {
                    // Update progress
                    const progress = Math.round((index / cards.length) * 90); // Leave 10% for ZIP generation
                    $('.progress-bar').css('width', `${progress}%`);
                    $('#download-progress-text').text(`Processing card ${index + 1} of ${cards.length}...`);

                    // Render card to image
                    renderCardToImage(card).then(imageUrl => {
                        // Convert data URL to blob
                        fetch(imageUrl)
                            .then(res => res.blob())
                            .then(blob => {
                                // Generate filename
                                const filenameParts = card.filename.split('.');
                                filenameParts.pop(); // Remove extension
                                const cleanedFilename = filenameParts.join('.').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                const filename = `${prefix}-${cleanedFilename}.png`;

                                // Add to ZIP
                                zip.file(filename, blob);
                                resolve();
                            })
                            .catch(reject);
                    }).catch(reject);
                });
            });

            // When all cards are processed, generate and download the ZIP
            Promise.all(promises)
                .then(() => {
                    // Update progress
                    $('.progress-bar').css('width', '95%');
                    $('#download-progress-text').text('Generating ZIP file...');

                    // Generate ZIP
                    return zip.generateAsync({
                        type: 'blob',
                        compression: 'DEFLATE',
                        compressionOptions: { level: 6 }
                    });
                })
                .then(blob => {
                    // Download ZIP
                    saveAs(blob, `${prefix}-cards.zip`);

                    // Update progress and close modal
                    $('.progress-bar').css('width', '100%');
                    $('#download-progress-text').text('Download complete!');

                    setTimeout(() => {
                        modal.hide();
                        setTimeout(() => {
                            $('#download-progress-modal').remove();
                        }, 300);
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error generating ZIP:', error);
                    $('#download-progress-text').text('Error generating ZIP. Please try again.');

                    setTimeout(() => {
                        modal.hide();
                        setTimeout(() => {
                            $('#download-progress-modal').remove();
                        }, 300);
                    }, 2000);
                });
        })
        .catch(error => {
            console.error('Error loading required libraries:', error);
            alert('Failed to load required libraries for ZIP generation. Please check your internet connection and try again.');
        });
}

// Function to load a script dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Function to render a card to PNG image
function renderCardToImage(card) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary canvas to render the card
            const canvas = document.createElement('canvas');
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext('2d');

            // Draw background
            ctx.fillStyle = card.backgroundColor;
            ctx.fillRect(0, 0, cardWidth, cardHeight);

            // Special handling for SVG to maintain quality
            if (card.isSvg) {
                // For SVGs, use an Image element but with special handling
                const svgImage = new Image();
                svgImage.onload = function () {
                    // Get effective logo size (individual or global)
                    const effectiveLogoSize = card.individualLogoSize !== null ? card.individualLogoSize : logoSize;

                    // Calculate dimensions based on percentage of card width
                    let logoWidth = (cardWidth * effectiveLogoSize) / 100;
                    let logoHeight = (svgImage.height * logoWidth) / svgImage.width;

                    // If height exceeds allowed maximum, scale down based on height
                    const maxHeight = (cardHeight * effectiveLogoSize) / 100;
                    if (logoHeight > maxHeight) {
                        logoHeight = maxHeight;
                        logoWidth = (svgImage.width * logoHeight) / svgImage.height;
                    }

                    // Calculate centered position
                    const centerX = (cardWidth - logoWidth) / 2;
                    const centerY = (cardHeight - logoHeight) / 2;

                    // Draw logo centered
                    ctx.drawImage(svgImage, centerX, centerY, logoWidth, logoHeight);

                    // Convert to PNG
                    const imageUrl = canvas.toDataURL('image/png');
                    resolve(imageUrl);
                };

                svgImage.onerror = function () {
                    reject(new Error('Failed to load SVG image'));
                };

                svgImage.src = card.logo;
            } else {
                // Regular image handling
                const logoImg = new Image();
                logoImg.onload = function () {
                    // Get effective logo size (individual or global)
                    const effectiveLogoSize = card.individualLogoSize !== null ? card.individualLogoSize : logoSize;

                    // Calculate dimensions based on percentage of card width
                    let logoWidth = (cardWidth * effectiveLogoSize) / 100;
                    let logoHeight = (logoImg.height * logoWidth) / logoImg.width;

                    // If height exceeds allowed maximum, scale down based on height
                    const maxHeight = (cardHeight * effectiveLogoSize) / 100;
                    if (logoHeight > maxHeight) {
                        logoHeight = maxHeight;
                        logoWidth = (logoImg.width * logoHeight) / logoImg.height;
                    }

                    // Calculate centered position
                    const centerX = (cardWidth - logoWidth) / 2;
                    const centerY = (cardHeight - logoHeight) / 2;

                    // Draw logo centered
                    ctx.drawImage(logoImg, centerX, centerY, logoWidth, logoHeight);

                    // Convert to PNG
                    const imageUrl = canvas.toDataURL('image/png');
                    resolve(imageUrl);
                };

                logoImg.onerror = function () {
                    reject(new Error('Failed to load logo image'));
                };

                logoImg.src = card.logo;
            }
        } catch (error) {
            reject(error);
        }
    });
}

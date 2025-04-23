/**
 * File handling functionalities
 */

// Function to handle file uploads
async function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        alert('Please select image files only.');
        return;
    }

    // Show loading indicator
    if (cards.length === 0) {
        $('#cards-container').html('<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Processing images...</p></div>');
    }

    // Process each file
    const promises = imageFiles.map(file => createCard(file));

    try {
        await Promise.all(promises);
        renderCards();
    } catch (error) {
        console.error('Error processing files:', error);
        alert('An error occurred while processing your files.');
        renderCards(); // Re-render what we have
    }
}

// Core function for processing card downloads - used by both single and batch download
async function processCardForDownload(card, index, prefix) {
    return new Promise((resolve, reject) => {
        try {
            // Create a canvas for the card
            const canvas = document.createElement('canvas');
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext('2d');

            // Draw background
            ctx.fillStyle = card.backgroundColor;
            ctx.fillRect(0, 0, cardWidth, cardHeight);

            // Load the logo image
            const logoImg = new Image();

            logoImg.onload = function () {
                // Get individual size or default
                const sizeToUse = card.individualLogoSize || logoSize;

                // Process and draw the logo - all images will be static PNGs
                processAndDrawLogo(ctx, logoImg, cardWidth, cardHeight, sizeToUse);

                // Convert canvas to blob
                canvas.toBlob(blob => {
                    // Generate a filename with prefix
                    let filename;
                    if (card.filename) {
                        // Strip extension and add .png
                        const basename = card.filename.split('.').slice(0, -1).join('.') || card.filename;
                        filename = `${prefix}${basename}.png`;
                    } else {
                        filename = `${prefix}card_${index + 1}.png`;
                    }

                    resolve({ blob, filename });
                }, 'image/png');
            };

            logoImg.onerror = function () {
                console.error('Error loading logo image');
                // Just create a colored card with no logo
                canvas.toBlob(blob => {
                    const filename = `${prefix}card_${index + 1}.png`;
                    resolve({ blob, filename });
                }, 'image/png');
            };

            logoImg.src = card.logo;

        } catch (error) {
            reject(error);
        }
    });
}

// Function to download a single card
async function downloadSingleCard(index) {
    if (index < 0 || index >= cards.length) return;

    const card = cards[index];
    const prefix = $('#filename-prefix').val() || 'loyalty_';

    // Show loading indicator on the button
    const $downloadBtn = $(`.download-card[data-index="${index}"]`);
    const originalText = $downloadBtn.html();
    $downloadBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    $downloadBtn.prop('disabled', true);

    try {
        // Process the card
        const { blob, filename } = await processCardForDownload(card, index, prefix);

        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error downloading card:', error);
        alert('Error downloading card: ' + error.message);
    } finally {
        // Restore button state
        $downloadBtn.html(originalText);
        $downloadBtn.prop('disabled', false);
    }
}

// Function to download all cards as zip
async function downloadAllCards() {
    if (cards.length === 0) {
        alert('No cards to download.');
        return;
    }

    // Show loading indicator
    const $downloadBtn = $('#download-all');
    const originalText = $downloadBtn.html();
    $downloadBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...');
    $downloadBtn.prop('disabled', true);

    try {
        const zip = new JSZip();
        const prefix = $('#filename-prefix').val() || 'loyalty_';

        // Process all cards in parallel
        const results = await Promise.all(
            cards.map((card, index) => processCardForDownload(card, index, prefix))
        );

        // Add each processed card to the zip
        results.forEach(({ blob, filename }) => {
            zip.file(filename, blob);
        });

        // Generate and download the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'loyalty_cards.zip');
    } catch (error) {
        console.error('Error generating ZIP:', error);
        alert('An error occurred while generating the ZIP file.');
    } finally {
        // Restore button state
        $downloadBtn.html(originalText);
        $downloadBtn.prop('disabled', false);
    }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
}

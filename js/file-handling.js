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

// Function to download all cards as zip
function downloadAllCards() {
    if (cards.length === 0) {
        alert('No cards to download.');
        return;
    }
    
    // Show loading indicator
    const $downloadBtn = $('#download-all');
    const originalText = $downloadBtn.html();
    $downloadBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...');
    $downloadBtn.prop('disabled', true);
    
    const zip = new JSZip();
    const promises = [];
    const prefix = $('#filename-prefix').val() || 'loyalty_';
    
    // Process each card
    cards.forEach((card, index) => {
        const cardPromise = new Promise((resolve) => {
            // Create a canvas to draw the card
            const canvas = document.createElement('canvas');
            canvas.width = cardWidth;
            canvas.height = cardHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw background
            ctx.fillStyle = card.backgroundColor;
            ctx.fillRect(0, 0, cardWidth, cardHeight);
            
            // Load the logo image
            const logoImg = new Image();
            logoImg.onload = function() {
                // Draw logo on canvas the same way as in preview
                drawLogoOnCanvas(ctx, logoImg, cardWidth, cardHeight, logoSize);
                
                // Convert canvas to blob
                canvas.toBlob(blob => {
                    // Generate a filename with prefix
                    const basename = card.filename || `card_${index + 1}`;
                    const filename = `${prefix}${basename}`;
                    
                    // Add to zip
                    zip.file(filename, blob);
                    resolve();
                }, 'image/png');
            };
            
            logoImg.onerror = function() {
                console.error('Error loading logo image');
                // Still resolve, but with a simple colored card
                canvas.toBlob(blob => {
                    const filename = `${prefix}card_${index + 1}.png`;
                    zip.file(filename, blob);
                    resolve();
                }, 'image/png');
            };
            
            logoImg.src = card.logo;
        });
        
        promises.push(cardPromise);
    });
    
    // Wait for all cards to be processed
    Promise.all(promises).then(() => {
        // Generate the zip file
        zip.generateAsync({ type: 'blob' }).then(content => {
            // Download the zip file
            saveAs(content, 'loyalty_cards.zip');
            // Restore button state
            $downloadBtn.html(originalText);
            $downloadBtn.prop('disabled', false);
        }).catch(err => {
            console.error('Error generating zip:', err);
            alert('An error occurred while generating the ZIP file.');
            $downloadBtn.html(originalText);
            $downloadBtn.prop('disabled', false);
        });
    });
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

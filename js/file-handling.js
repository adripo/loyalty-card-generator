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
            // Determine if this is an animated format (should not be converted to PNG)
            const isAnimated = ['image/gif', 'image/apng', 'image/webp'].some(type => 
                card.logo.startsWith(`data:${type}`));
            
            if (isAnimated) {
                // For animated formats, use original image data
                fetch(card.logo)
                    .then(res => res.blob())
                    .then(blob => {
                        const basename = card.filename || `card_${index + 1}`;
                        zip.file(basename, blob);
                        resolve();
                    })
                    .catch(err => {
                        console.error('Error fetching animated image:', err);
                        resolve(); // Resolve anyway to continue with other cards
                    });
            } else {
                // For static images, create PNG
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
                    // Process and draw logo, removing transparent borders
                    processAndDrawLogo(ctx, logoImg, cardWidth, cardHeight, logoSize);
                    
                    // Convert canvas to blob
                    canvas.toBlob(blob => {
                        // Generate a filename with prefix
                        const basename = card.filename ? card.filename.split('.')[0] + '.png' : `card_${index + 1}.png`;
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
            }
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


// Function to download a single card
function downloadSingleCard(index) {
    if (index < 0 || index >= cards.length) return;
    
    const card = cards[index];
    const prefix = $('#filename-prefix').val() || 'loyalty_';
    
    // Show loading indicator on the button
    const $downloadBtn = $(`.download-card[data-index="${index}"]`);
    const originalText = $downloadBtn.html();
    $downloadBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    $downloadBtn.prop('disabled', true);
    
    // Determine if this is an animated format (should not be converted to PNG)
    const isAnimated = ['image/gif', 'image/apng', 'image/webp'].some(type => 
        card.logo.startsWith(`data:${type}`));
    
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
        // If animated format, use the original image
        if (isAnimated) {
            // Create an anchor element for download
            const link = document.createElement('a');
            link.href = card.logo;
            link.download = `${prefix}${card.filename || `card_${index + 1}.gif`}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Restore button state
            $downloadBtn.html(originalText);
            $downloadBtn.prop('disabled', false);
        } else {
            // For static images, process and trim transparent borders
            processAndDrawLogo(ctx, logoImg, cardWidth, cardHeight, logoSize);
            
            // Convert canvas to blob
            canvas.toBlob(blob => {
                // Generate a filename with prefix
                const basename = card.filename || `card_${index + 1}`;
                let filename = `${prefix}${basename}`;
                
                // Ensure it has .png extension for static images
                if (!filename.toLowerCase().endsWith('.png')) {
                    filename = filename.split('.')[0] + '.png';
                }
                
                // Create download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                // Restore button state
                $downloadBtn.html(originalText);
                $downloadBtn.prop('disabled', false);
            }, 'image/png');
        }
    };
    
    logoImg.onerror = function() {
        console.error('Error loading logo image');
        $downloadBtn.html(originalText);
        $downloadBtn.prop('disabled', false);
        alert('Error loading image for download');
    };
    
    logoImg.src = card.logo;
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

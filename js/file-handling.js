/**
 * File handling functionalities: processing uploads and setting up drag & drop.
 */

/**
 * Processes an array/FileList of files, filters for images, and creates cards.
 * @param {FileList|Array<File>} files - The files to process.
 */
async function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        alert('No valid image files selected. Please select PNG, JPG, GIF, SVG, WEBP, etc.');
        return;
    }

    const fileCount = imageFiles.length;
    let processedCount = 0;
    const errorFiles = [];

    // Show initial loading indicator only if the container is empty
    const container = $('#cards-container');
    if (cards.length === 0) {
        container.html(`
            <div class="col-12 text-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0" id="loading-text">Processing 1 of ${fileCount} images...</p>
            </div>
        `);
    }
    const loadingTextElement = $('#loading-text'); // Get reference to update text

    // Disable buttons during processing
    $('#file-button, #download-all, #clear-all').prop('disabled', true);

    try {
        // Process files sequentially to manage memory and provide progress
        for (const file of imageFiles) {
            processedCount++;
            if (loadingTextElement.length) {
                 loadingTextElement.text(`Processing ${processedCount} of ${fileCount} images: ${file.name}...`);
            }
            try {
                await createCard(file); // Await card creation (includes reading file)
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                errorFiles.push(file.name); // Collect names of files that failed
            }
        }
    } finally {
        // Re-enable buttons
        // Note: download/clear buttons state will be updated by renderCards/updateCardCounter
        $('#file-button').prop('disabled', false);

        // Render cards now that processing is complete
        renderCards(); // This will replace the loading indicator

        // Show summary alert if there were errors
        if (errorFiles.length > 0) {
            alert(`Finished processing. Could not process ${errorFiles.length} file(s):\n- ${errorFiles.join('\n- ')}\n\nPlease ensure they are valid image files.`);
        }
    }
}

/**
 * Sets up drag and drop event listeners for the designated drop area element.
 */
function setupDragAndDrop() {
    const dropArea = document.getElementById('drop-area');
    if (!dropArea) {
        console.warn("Drop area element not found for drag & drop setup.");
        return;
    }

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        // Add body listener too to prevent browser default file opening
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item enters it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    // Remove highlight when item leaves or is dropped
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    // --- Helper functions ---
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        // Check if full page drop is active; if so, don't apply this highlight
        if (!isDraggingFile) {
            dropArea.classList.add('highlight');
        }
    }

    function unhighlight() {
         dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        // Ensure full page overlay is hidden if drop happens here
        isDraggingFile = false;
        const fullPageDrop = document.getElementById('full-page-drop');
        if (fullPageDrop) fullPageDrop.classList.add('d-none');

        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
             handleFiles(files); // Process the dropped files
        }
    }
}

// Note: Full page drag/drop logic (setupFullPageDragDrop) is in app.js
//       as it interacts more with the global state (isDraggingFile)

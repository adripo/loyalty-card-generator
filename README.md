# Loyalty Card Generator

A web-based tool that generates loyalty cards from your logos. Upload images to create cards with customizable backgrounds in standard credit card ratio.

## Features

- **Upload Multiple Logos**: Drag & drop or select files to upload
- **Credit Card Format**: All cards use the standard credit card aspect ratio (1.585:1)
- **Custom Width**: Set any width between 100-2000px
- **Customizable Backgrounds**: Choose from presets or pick your own color
- **Theme Support**: Light, dark, and system themes
- **Batch Download**: Download all cards as a ZIP file
- **In-Browser Processing**: No server uploads required
- **Size Warnings**: Clear indicators when images need scaling

## Usage

1. **Upload Logos**: Drag & drop logo files or click "Select Files"
2. **Customize Settings**: 
   - Adjust card width (default: 512px)
   - Set filename prefix
   - Control logo size
   - Choose background colors
3. **Preview Cards**: Review how your cards will look
4. **Download**: Click "Download All Cards" to get a ZIP with all your cards

## Development

1. Clone the repository
2. Open `index.html` in your browser
> No build step or server required!

## Technologies Used

- HTML5, CSS3, JavaScript
- Bootstrap 5
- jQuery
- JSZip (for ZIP file generation)
- FileSaver.js (for downloading files)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

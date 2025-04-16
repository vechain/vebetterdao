# Public Folder Organization

This folder contains static assets used by the frontend application. The structure follows the best practices for organizing public assets:

## Directory Structure

- `/assets`: Main directory for all application assets

  - `/animations`: JSON animation files (Lottie)
  - `/backgrounds`: Background images and patterns
  - `/favicon`: Favicon files
  - `/icons`: UI icons and small visual elements
  - `/images`: General images and photos
  - `/logos`: Brand logos
  - `/mascot`: Mascot-related images
  - `/tokens`: Token images

- `/.well-known`: Special directory for configuration files required by external services

## Best Practices

1. Place new assets in the appropriate subdirectory based on their type.
2. Use appropriate file formats:
   - **SVG** for icons, logos, and simple graphics.
   - **WebP** for photos and images (preferred over PNG/JPG for better performance).
   - **PNG** as fallback only when WebP support is a concern.
   - **JSON** for Lottie animations.
3. Optimize images before adding them to the repository.

### Image Optimization with Homebrew/WebP Package

To optimize images using the WebP format with Homebrew, follow these steps:

1. **Install Homebrew** (if you haven't already):
   Open your terminal and run the following command:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install the WebP package**:
   Use Homebrew to install the WebP tools by running:

   ```bash
   brew install webp
   ```

3. **Convert images to WebP format**:
   Navigate to the directory containing your images and use the `cwebp` command to convert images. For example:

   ```bash
   cwebp input_image.png -o output_image.webp
   ```

   Replace `input_image.png` with the name of your image file and `output_image.webp` with the desired output file name.

4. **Convert multiple images at once**:
   To convert all PNG images in a directory to WebP, you can use the following command:

   ```bash
   for file in *.png; do
     base=${file%.png}
     cwebp -q 80 "$file" -o "${base}.webp"
   done
   ```

5. **Adjust quality settings** (optional):
   You can adjust the quality of the output image by adding the `-q` option followed by a value between 0 and 100. For example:

   ```bash
   cwebp -q 80 input_image.png -o output_image.webp
   ```

6. **Verify the output**:
   Check the output directory to ensure the WebP images have been created successfully.

By following these steps, you can effectively optimize your images for better performance in your application.

7. Reference assets in components using the path format: `/assets/[subdirectory]/[filename].[extension]`

## WebP Usage

All raster images in this project have been converted to WebP format for improved performance. WebP offers significantly smaller file sizes compared to PNG and JPG while maintaining similar visual quality, which helps improve page load times.

If you need to add new images to the project:

1. Convert them to WebP format using the instructions above
2. Reference them in your components with the `.webp` extension
3. Only use PNG or JPG if you need support for older browsers or specific use cases where WebP is not suitable

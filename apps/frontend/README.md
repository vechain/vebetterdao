This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Public Folder Organization

### Directory Structure

- `/assets`: Main directory for all application assets
  - `/animations`: JSON animation files (Lottie)
  - `/backgrounds`: Background images and patterns
  - `/icons`: UI icons and small visual elements
  - `/images`: General images and photos
  - `/logos`: Brand logos
  - `/mascot`: Mascot-related images
  - `/tokens`: Token images

### Best Practices

1. Place new assets in the appropriate subdirectory based on their type.
2. Use appropriate file formats:
   - **SVG** for icons, logos, and simple graphics.
   - **WebP** for photos and images (preferred over PNG/JPG for better performance).
   - **PNG** as fallback only when WebP support is a concern.
   - **JSON** for Lottie animations.
3. Optimize images before adding them to the repository.

#### Image Optimization with Homebrew/WebP Package

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

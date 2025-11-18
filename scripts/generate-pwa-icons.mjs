import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function generateIconDataUrls(svgPath) {
  const sizes = [192, 512];
  const dataUrls = {};
  for (const size of sizes) {
    const pngBuffer = await sharp(svgPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    dataUrls[size] = 'data:image/png;base64,' + pngBuffer.toString('base64');
  }
  return dataUrls;
}

async function run() {
  const projectRoot = process.cwd();
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const svgPath = path.join(projectRoot, 'public', 'favicon.svg');

  // Ensure files exist
  try {
    await fs.access(svgPath);
  } catch {
    console.error('favicon.svg no encontrado en public/.');
    process.exit(1);
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const dataUrls = await generateIconDataUrls(svgPath);

  // Replace or append PNG icons with data URLs
  const sizesToReplace = new Set(['192x192', '512x512']);
  const replacedSizes = new Set();
  const updatedIcons = (manifest.icons || []).map((icon) => {
    if (icon.type === 'image/png' && sizesToReplace.has(icon.sizes)) {
      const size = icon.sizes.startsWith('192') ? 192 : 512;
      replacedSizes.add(icon.sizes);
      return {
        ...icon,
        src: dataUrls[size],
        purpose: icon.purpose || 'any maskable',
      };
    }
    return icon;
  });

  // Append missing sizes if any
  if (!replacedSizes.has('192x192')) {
    updatedIcons.push({
      src: dataUrls[192],
      type: 'image/png',
      sizes: '192x192',
      purpose: 'any maskable',
    });
  }
  if (!replacedSizes.has('512x512')) {
    updatedIcons.push({
      src: dataUrls[512],
      type: 'image/png',
      sizes: '512x512',
      purpose: 'any maskable',
    });
  }

  manifest.icons = updatedIcons;

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('Manifest actualizado con iconos PNG en data-URL para 192x192 y 512x512.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
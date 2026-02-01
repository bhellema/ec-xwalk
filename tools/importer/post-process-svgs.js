/* eslint-disable */
/**
 * Post-processing script to extract inline SVGs and inject proper image references
 *
 * This script:
 * 1. Fetches the original source page
 * 2. Extracts inline SVG elements using the same selectors as the parser
 * 3. Saves SVGs as separate files in the media directory
 * 4. Updates the generated HTML to reference these SVG files
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Fetch HTML content from URL
 */
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Extract SVGs from source page using the same logic as the parser
 */
function extractSVGs(html, url) {
  const dom = new JSDOM(html, { url });
  const { document } = dom.window;

  const svgs = [];
  const cards = Array.from(document.querySelectorAll('.card'));

  cards.forEach((card, index) => {
    const cardImageDiv = card.querySelector('.card-image');
    if (!cardImageDiv) return;

    const svg = cardImageDiv.querySelector('svg');
    if (!svg) return;

    const title = card.querySelector('.title');
    const companyName = title ? title.textContent.trim() : `company-${index + 1}`;

    // Serialize SVG
    const serializer = new (dom.window.XMLSerializer)();
    let svgString = serializer.serializeToString(svg);

    // Ensure xmlns attribute for standalone rendering
    if (!svgString.includes('xmlns=')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    svgs.push({
      index,
      companyName,
      svgString
    });
  });

  return svgs;
}

/**
 * Sanitize filename from company name
 */
function sanitizeFilename(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Save SVG files to media directory
 */
function saveSVGFiles(svgs, mediaDir) {
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const savedFiles = [];

  svgs.forEach(({ companyName, svgString }) => {
    const filename = `${sanitizeFilename(companyName)}-logo.svg`;
    const filepath = path.join(mediaDir, filename);

    fs.writeFileSync(filepath, svgString, 'utf-8');
    console.log(`✅ Saved SVG: ${filename}`);

    savedFiles.push({
      companyName,
      filename,
      relativePath: `./media/${filename}`
    });
  });

  return savedFiles;
}

/**
 * Update HTML to inject image references
 */
function updateHTML(htmlPath, savedFiles) {
  let html = fs.readFileSync(htmlPath, 'utf-8');

  const dom = new JSDOM(html);
  const { document } = dom.window;

  // Find the cards-company block
  const cardsBlock = document.querySelector('.cards-company');
  if (!cardsBlock) {
    console.warn('⚠️  cards-company block not found in HTML');
    return;
  }

  // Find all card rows (direct children divs)
  const cardRows = Array.from(cardsBlock.children).filter(el => el.tagName === 'DIV');

  savedFiles.forEach(({ filename, relativePath }, index) => {
    if (index >= cardRows.length) return;

    const cardRow = cardRows[index];
    const imageCellDiv = cardRow.querySelector('div:first-child');

    if (!imageCellDiv) return;

    // Check if there's already an img tag (shouldn't be, but just in case)
    let img = imageCellDiv.querySelector('img');

    if (!img) {
      // Create new img element
      const p = document.createElement('p');
      img = document.createElement('img');
      p.appendChild(img);

      // Insert after the field comment
      const fieldComment = Array.from(imageCellDiv.childNodes)
        .find(node => node.nodeType === 8 && node.textContent.includes('field:image'));

      if (fieldComment) {
        fieldComment.after(p);
      } else {
        imageCellDiv.appendChild(p);
      }
    }

    // Set image source
    img.src = relativePath;
    img.alt = 'Company logo';

    console.log(`✅ Injected image reference for card ${index + 1}: ${relativePath}`);
  });

  // Write updated HTML (extract only body content, not the wrapper tags)
  const bodyContent = document.body.innerHTML;
  fs.writeFileSync(htmlPath, bodyContent, 'utf-8');
  console.log(`✅ Updated HTML: ${htmlPath}`);
}

/**
 * Main processing function
 */
async function processPage(config) {
  const { sourceURL, htmlPath, contentDir } = config;

  console.log(`\n🔄 Post-processing SVGs for: ${sourceURL}`);
  console.log(`   HTML file: ${htmlPath}`);

  // 1. Fetch source HTML
  console.log('\n1️⃣  Fetching source HTML...');
  const html = await fetchHTML(sourceURL);

  // 2. Extract SVGs
  console.log('2️⃣  Extracting SVG elements...');
  const svgs = extractSVGs(html, sourceURL);
  console.log(`   Found ${svgs.length} SVG(s)`);

  if (svgs.length === 0) {
    console.log('⚠️  No SVGs found to process');
    return;
  }

  // 3. Save SVG files
  console.log('3️⃣  Saving SVG files...');
  const mediaDir = path.join(contentDir, 'media');
  const savedFiles = saveSVGFiles(svgs, mediaDir);

  // 4. Update HTML
  console.log('4️⃣  Updating HTML with image references...');
  updateHTML(htmlPath, savedFiles);

  console.log('\n✅ Post-processing complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node post-process-svgs.js <sourceURL> <htmlPath> [contentDir]');
    console.error('Example: node post-process-svgs.js https://example.com/about content/about.plain.html content');
    process.exit(1);
  }

  const config = {
    sourceURL: args[0],
    htmlPath: args[1],
    contentDir: args[2] || path.dirname(args[1])
  };

  processPage(config).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
}

export default processPage;

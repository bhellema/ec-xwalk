import { JSDOM } from 'jsdom';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock WebImporter for the import script
global.WebImporter = {
  DOMUtils: {
    remove: (element, selectors) => {
      selectors.forEach(selector => {
        try {
          element.querySelectorAll(selector).forEach(el => el.remove());
        } catch (e) {
          console.warn(`Failed to remove selector: ${selector}`, e.message);
        }
      });
    }
  },
  Blocks: {
    createBlock: (document, config) => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = config.name;
      th.colSpan = 2;
      headerRow.appendChild(th);
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      config.cells.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
          const td = document.createElement('td');
          if (cell instanceof DocumentFragment) {
            td.appendChild(cell.cloneNode(true));
          } else {
            td.appendChild(cell);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      return table;
    }
  },
  rules: {
    createMetadata: () => {},
    transformBackgroundImages: () => {},
    adjustImageUrls: () => {}
  },
  FileUtils: {
    sanitizePath: (p) => p.toLowerCase().replace(/[^a-z0-9/-]/g, '-').replace(/-+/g, '-')
  }
};

// Import the bundled script
const importScript = await import('./import-about-us-page.bundle.js');

// URL to import
const url = 'https://www.themeateater.com/about-us';

console.log(`Fetching ${url}...`);

const response = await fetch(url);
const html = await response.text();

const dom = new JSDOM(html);
const { document, DocumentFragment } = dom.window;

// Make DocumentFragment available globally for the parser
global.DocumentFragment = DocumentFragment;

// Run the transformation
const results = importScript.default.transform({
  document,
  url,
  html,
  params: { originalURL: url }
});

// Save the results
results.forEach(result => {
  const outputPath = path.join(__dirname, '../../content', result.path + '.plain.html');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Serialize with comments preserved
  const serialized = dom.serialize();
  const bodyMatch = serialized.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : result.element.innerHTML;

  fs.writeFileSync(outputPath, bodyContent);
  console.log(`✅ Created: ${outputPath}`);
  console.log(`   Title: ${result.report.title}`);
  console.log(`   Blocks: ${result.report.blocks.join(', ')}`);
});

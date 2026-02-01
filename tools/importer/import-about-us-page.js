/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS - Import all parsers needed for this template
import cardsCompanyParser from './parsers/cards-company.js';

// TRANSFORMER IMPORTS - Import all transformers
import themeateaterCleanupTransformer from './transformers/themeateater-cleanup.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'cards-company': cardsCompanyParser,
};

// TRANSFORMER REGISTRY - Array of transformer functions
const transformers = [
  themeateaterCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'about-us-page',
  description: 'About Us page with company information',
  urls: [
    'https://www.themeateater.com/about-us',
    'http://themeateater.com/about-us'
  ],
  blocks: [
    {
      name: 'cards-company',
      instances: ['.columns']
    }
  ]
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, payload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  
  // Find all block instances defined in the template
  template.blocks.forEach(blockDef => {
    blockDef.instances.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach(element => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null
        });
      });
    });
  });
  
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Main transformation function
   * Transforms the about-us page from source HTML to AEM format
   */
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);
    
    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    
    // 3. Parse each block using registered parsers
    pageBlocks.forEach(block => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });
    
    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 4.5. Add section breaks (horizontal rules) around blocks
    // This ensures blocks get their own sections in EDS
    const blocks = main.querySelectorAll('div[class*="-"]');
    blocks.forEach(block => {
      // Only add section breaks for block divs (not nested divs)
      if (block.className && /^[a-z]+(-[a-z]+)*$/.test(block.className)) {
        // Add horizontal rule before the block
        const hrBefore = document.createElement('hr');
        block.parentNode.insertBefore(hrBefore, block);

        // Add horizontal rule after the block
        const hrAfter = document.createElement('hr');
        if (block.nextSibling) {
          block.parentNode.insertBefore(hrAfter, block.nextSibling);
        } else {
          block.parentNode.appendChild(hrAfter);
        }
      }
    });

    // 5. Apply WebImporter built-in rules
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    
    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );
    
    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map(b => b.name),
      }
    }];
  }
};

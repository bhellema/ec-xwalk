/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-company block
 *
 * Source: https://www.themeateater.com/about-us
 *
 * Block Structure (Container Block):
 * - This is a container block where each company card becomes one row
 * - Each row has 2 columns: [image | text]
 * - Model fields: image (reference), text (richtext)
 *
 * Extracts company cards with:
 * - Image (company logo - SVG)
 * - Title (company name)
 * - Description (company description)
 */
export default function parse(element, { document }) {
  // Extract all company cards from the columns container
  const cards = Array.from(element.querySelectorAll('.card'));

  // Build cells array - each card becomes one row with 2 columns
  const cells = [];

  cards.forEach((card) => {
    // Extract image (SVG logo in card-image div)
    const cardImageDiv = card.querySelector('.card-image');
    let imageElement = null;

    if (cardImageDiv) {
      // Try to find SVG first (company logos are SVGs)
      const svg = cardImageDiv.querySelector('svg');
      if (svg) {
        imageElement = svg;
        console.log('Found SVG for card:', svg.outerHTML.substring(0, 50));
      } else {
        // Fallback to img tag if no SVG
        imageElement = cardImageDiv.querySelector('img');
        if (!imageElement) {
          console.log('No image found in card-image div. innerHTML:', cardImageDiv.innerHTML.substring(0, 100));
        }
      }
    } else {
      console.log('No .card-image div found in card');
    }

    // Extract title
    const title = card.querySelector('.title');

    // Extract description - get the content div text
    const contentDiv = card.querySelector('.card-content .content');

    // Only process cards that have at least a title
    if (!title) {
      return;
    }

    // Column 1: Image with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (imageElement) {
      const p = document.createElement('p');

      // Convert SVG to blob URL so WebImporter can download it as a separate file
      if (imageElement.tagName.toLowerCase() === 'svg') {
        // Serialize SVG to string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(imageElement);

        // Ensure SVG has xmlns for standalone rendering
        if (!svgString.includes('xmlns=')) {
          svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Create a Blob from the SVG string
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

        // Create a blob URL that WebImporter can download
        const blobUrl = URL.createObjectURL(svgBlob);

        // Create img element pointing to the blob URL
        const img = document.createElement('img');
        img.src = blobUrl;
        img.alt = 'Company logo';

        // Set width/height if available to help with rendering
        if (imageElement.hasAttribute('width')) {
          img.setAttribute('width', imageElement.getAttribute('width'));
        }
        if (imageElement.hasAttribute('height')) {
          img.setAttribute('height', imageElement.getAttribute('height'));
        }

        p.appendChild(img);
        console.log('Created blob URL for SVG:', blobUrl);
      } else {
        // Regular img element - just clone it
        const clonedImage = imageElement.cloneNode(true);
        p.appendChild(clonedImage);
      }

      imageCell.appendChild(p);
    }

    // Column 2: Text with field hint
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    if (title) {
      const h4 = document.createElement('h4');
      h4.textContent = title.textContent.trim();
      textCell.appendChild(h4);
    }

    if (contentDiv) {
      const p = document.createElement('p');
      p.textContent = contentDiv.textContent.trim();
      textCell.appendChild(p);
    }

    // Add row with 2 columns
    cells.push([imageCell, textCell]);
  });

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-company',
    cells
  });

  // Replace original element with structured block table
  element.replaceWith(block);
}

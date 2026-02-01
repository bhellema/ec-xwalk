/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-podcast block
 *
 * Source: https://www.themeateater.com/listen
 * Base Block: cards
 *
 * Block Structure (Container Block):
 * - This is a container block where each podcast card becomes one row
 * - Each row has 2 columns: [image | text]
 * - Model fields: image (reference), text (richtext)
 *
 * Source HTML Pattern:
 * <div class="podcasts_nB1Ll">
 *   <div class="podcast_P6efM">
 *     <a href="/listen/meateater">
 *       <picture>
 *         <img src="..." alt="The MeatEater Podcast">
 *       </picture>
 *     </a>
 *   </div>
 *   ... (more podcast cards)
 * </div>
 *
 * Generated: 2026-01-30
 */
export default function parse(element, { document }) {
  // Extract all podcast cards from the container
  // Using flexible selectors to handle variations
  const cards = Array.from(
    element.querySelectorAll('.podcast_P6efM') ||
    element.querySelectorAll('[class*="podcast"]') ||
    element.querySelectorAll(':scope > div')
  );

  // Build cells array - each card becomes one row with 2 columns
  const cells = [];

  cards.forEach((card) => {
    // Extract image - try multiple selectors
    const img = card.querySelector('img') ||
                card.querySelector('picture img') ||
                card.querySelector('[class*="fillRelativePosition"] img');

    // Extract link for text content
    const link = card.querySelector('a') ||
                 card.querySelector('[class*="link"]');

    // Get the text content from image alt or link
    let textContent = '';
    if (img && img.alt) {
      textContent = img.alt;
    } else if (link && link.textContent.trim()) {
      textContent = link.textContent.trim();
    }

    // Create text element wrapped in link if available
    let textElement;
    if (link && textContent) {
      // Create a new link element with the text
      textElement = document.createElement('p');
      const linkElement = document.createElement('a');
      linkElement.href = link.href;
      linkElement.textContent = textContent;
      textElement.appendChild(linkElement);
    } else if (textContent) {
      // Just create a paragraph with the text
      textElement = document.createElement('p');
      textElement.textContent = textContent;
    }

    // Only add row if we have content
    if (img || textElement) {
      // Column 1: Image with field hint
      const imageCell = document.createDocumentFragment();
      if (img) {
        imageCell.appendChild(document.createComment(' field:image '));
        imageCell.appendChild(img.cloneNode(true));
      }

      // Column 2: Text with field hint
      const textCell = document.createDocumentFragment();
      if (textElement) {
        textCell.appendChild(document.createComment(' field:text '));
        textCell.appendChild(textElement);
      }

      // Add row with 2 columns
      cells.push([imageCell, textCell]);
    }
  });

  // Create block using WebImporter utility
  // Using exact variant name 'cards-podcast' (not 'Cards (podcast)' or 'Cards-Podcast')
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-podcast', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}

import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // ImageLink block has two rows with one cell each
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Row 1: Image
  const imageRow = rows[0];
  // Row 2: Link URL
  const linkRow = rows[1];

  // Extract image from first row
  const imageCell = imageRow.querySelector(':scope > div');
  if (!imageCell) return;

  let picture = imageCell.querySelector('picture');
  const img = imageCell.querySelector('img');

  // Extract link URL from second row
  const linkCell = linkRow.querySelector(':scope > div');
  if (!linkCell) return;

  const linkElement = linkCell.querySelector('a');
  const linkUrl = linkElement ? linkElement.href : linkCell.textContent.trim();

  // If we have both image and link, wrap the image with anchor
  if ((picture || img) && linkUrl) {
    // Create the anchor element
    const anchor = document.createElement('a');
    anchor.href = linkUrl;
    anchor.className = 'image-link-link';

    // Optimize the image if it exists
    if (img && !picture) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false);
      picture = optimizedPic;
    } else if (picture && img) {
      // Optimize existing picture
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false);
      picture = optimizedPic;
    }

    // Wrap the image with the anchor
    if (picture) {
      anchor.appendChild(picture);
    }

    // Clear the block and add the wrapped image
    block.textContent = '';
    block.appendChild(anchor);
  }
}

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    
    // Create card structure
    const cardImage = document.createElement('div');
    cardImage.className = 'cards-company-card-image';
    
    const cardContent = document.createElement('div');
    cardContent.className = 'cards-company-card-content';
    
    const cardFooter = document.createElement('div');
    cardFooter.className = 'cards-company-card-footer';
    
    // Process columns: column 1 = image, column 2 = text content
    const columns = [...row.children];
    
    // Column 1: Image (company logo)
    if (columns[0]) {
      const picture = columns[0].querySelector('picture');
      if (picture) {
        cardImage.append(picture);
      } else {
        // Handle direct img elements (e.g., from SVG post-processing)
        const img = columns[0].querySelector('img');
        if (img) {
          cardImage.append(img);
        }
      }
    }
    
    // Column 2: Text content (title, subtitle, description, link)
    if (columns[1]) {
      const textContent = columns[1].cloneNode(true);
      
      // Extract link (last <a> in the text content)
      const links = textContent.querySelectorAll('a');
      if (links.length > 0) {
        const lastLink = links[links.length - 1];
        cardFooter.append(lastLink);
        lastLink.remove(); // Remove from cardContent
      }
      
      cardContent.append(...textContent.children);
    }
    
    // Assemble card
    li.append(cardImage, cardContent, cardFooter);
    ul.append(li);
  });
  
  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  
  block.textContent = '';
  block.append(ul);
}

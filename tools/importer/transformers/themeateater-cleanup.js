/**
 * TheMeatEater Site Transformer
 * Removes site-wide elements that block content or are not needed in migrated content
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform'
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Unwrap wrapper divs that contain content (instead of removing them)
    // This preserves the content while removing the wrapper elements
    const unwrapSelectors = [
      '#__nuxt',
      '#__layout',
      '.contentCenterDesktop_CkK5D',
      '.contentCenterMobile_aHlnC',
      '.page-container',
      'section.body'
    ];

    unwrapSelectors.forEach(selector => {
      const wrappers = element.querySelectorAll(selector);
      wrappers.forEach(wrapper => {
        // Move all children to the parent, then remove the wrapper
        while (wrapper.firstChild) {
          wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.remove();
      });
    });

    // Unwrap .content wrappers (but not .card-content .content inside cards)
    const contentDivs = Array.from(element.querySelectorAll('.content'));
    contentDivs.forEach(contentDiv => {
      // Only unwrap if it's not inside a card
      if (!contentDiv.closest('.card')) {
        while (contentDiv.firstChild) {
          contentDiv.parentNode.insertBefore(contentDiv.firstChild, contentDiv);
        }
        contentDiv.remove();
      }
    });

    // Remove elements that should be completely removed (no content preservation)
    WebImporter.DOMUtils.remove(element, [
      'link[rel="stylesheet"]',
      'link[href*="fonts.googleapis"]',
      'link',
      '.pageNotice',
      '#pageHeaderSearchBarOffsetTop',
      '.notifications_B9V49',
      '#third-party-modals',
      '#dynamic-react-root',
      '[class*="kl-private-reset-css"]',
      '[class*="needsclick"]',
      '[class*="go1272136950"]',
      '[class*="go249761392"]',
      '.headcrumb'
    ]);

    // Remove navigation elements (header, nav)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'nav',
      '.pageHeader',
      '[class*="pageHeader"]',
      '[class*="menu_"]',
      '[class*="submenu_"]'
    ]);

    // Remove footer elements
    WebImporter.DOMUtils.remove(element, [
      'footer',
      '.pageFooter',
      '[class*="pageFooter"]'
    ]);

    // Remove Klaviyo email signup modal (blocks content access)
    WebImporter.DOMUtils.remove(element, [
      '[class*="klaviyo-form"]',
      '[class*="klaviyo-close"]',
      '[class*="klaviyo-"]'
    ]);

    // Remove AudioEye accessibility elements (not needed in migrated content)
    WebImporter.DOMUtils.remove(element, [
      '#ae_app',
      '.audioeye-skip-link',
      '#audioeye_new_window_message',
      '#audioeye_notification_message',
      '[data-audioeye-lang]',
      '[class*="audioeye"]'
    ]);

    // Remove search modal overlay
    WebImporter.DOMUtils.remove(element, [
      '.searchModal_X1b\\+g',
      '[class*="searchModal"]'
    ]);

    // Remove non-podcast navigation sections (audiobooks, games, etc.)
    WebImporter.DOMUtils.remove(element, [
      '[class*="group_iTTa7"]',
      '[class*="group_l7I2m"]',
      '[class*="item_FnX10"]',
      '[class*="dropdown_"]',
      '[class*="section_LVlLx"]',
      '[class*="backdrop_"]',
      '[class*="linkContainer_"]'
    ]);

    // Fix body scrolling (remove class that prevents scrolling)
    const body = element.querySelector('body');
    if (body && body.classList.contains('klaviyo-prevent-body-scrolling')) {
      body.classList.remove('klaviyo-prevent-body-scrolling');
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Final cleanup - remove remaining unwanted elements
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'link[rel="stylesheet"]',
      'noscript',
      'iframe'
    ]);

    // Remove all remaining wrapper divs that don't have block classes
    // This flattens the structure so blocks and tables are at the correct level
    const body = element.querySelector('body') || element;
    const removeWrapperDivs = (parent) => {
      const divs = Array.from(parent.querySelectorAll(':scope > div'));
      divs.forEach(div => {
        // Don't unwrap divs that are blocks
        const isBlock = div.className && /^[a-z]+(-[a-z]+)*$/.test(div.className);
        // Don't unwrap divs that are inside table cells
        const isInsideTable = div.closest('table') !== null;

        if (!isBlock && !isInsideTable) {
          // Unwrap this div - move children to parent
          while (div.firstChild) {
            parent.insertBefore(div.firstChild, div);
          }
          div.remove();
        }
      });
    };

    // Run unwrapping multiple times to handle nested wrappers
    for (let i = 0; i < 5; i++) {
      removeWrapperDivs(body);
    }

    // Remove all HTML comments EXCEPT field markers
    const walker = element.ownerDocument.createTreeWalker(
      body,
      128, // NodeFilter.SHOW_COMMENT
      null,
      false
    );
    const commentsToRemove = [];
    let node;
    while (node = walker.nextNode()) {
      // Keep field marker comments (field:image, field:text, etc)
      const commentText = node.textContent.trim();
      if (!commentText.startsWith('field:')) {
        commentsToRemove.push(node);
      }
    }
    commentsToRemove.forEach(comment => comment.remove());

    // Remove standalone paragraphs that aren't part of blocks
    // These often come from leftover navigation or layout elements
    const standaloneParagraphs = Array.from(body.querySelectorAll('p')).filter(p => {
      // Keep paragraphs that are inside block tables
      const parentTable = p.closest('table');
      if (parentTable && parentTable.querySelector('th')?.textContent?.includes('-')) {
        return false; // Keep it, it's part of a block
      }
      // Keep paragraphs that are inside metadata divs
      if (p.closest('.metadata')) {
        return false; // Keep it, it's metadata
      }
      // Remove standalone paragraphs with minimal content
      const text = p.textContent.trim();
      if (text.length <= 3 || text === 'X') {
        return true; // Remove it
      }
      return false;
    });

    standaloneParagraphs.forEach(p => p.remove());

    // Remove all empty wrapper divs (but not divs inside blocks)
    const allDivs = Array.from(body.querySelectorAll('div'));
    allDivs.forEach(div => {
      // Don't remove divs that are inside block containers
      const isInsideBlock = div.parentElement && div.parentElement.className && /^[a-z]+(-[a-z]+)*$/.test(div.parentElement.className);
      const isBlockChild = div.parentElement && div.parentElement.parentElement && div.parentElement.parentElement.className && /^[a-z]+(-[a-z]+)*$/.test(div.parentElement.parentElement.className);

      // Remove divs that are empty or only contain whitespace, unless they're part of a block
      if (!isInsideBlock && !isBlockChild && !div.textContent.trim() && div.querySelectorAll('img, table, figure').length === 0) {
        div.remove();
      }
    });

    // Remove all remaining class attributes except block class names
    const allElements = body.querySelectorAll('*');
    allElements.forEach(el => {
      // Keep class attributes that look like block names (e.g., cards-podcast, cards-company)
      if (el.className && !/^[a-z]+(-[a-z]+)*$/.test(el.className)) {
        el.removeAttribute('class');
      }
      // Remove other unnecessary attributes except essential ones
      // Include SVG attributes to preserve SVG graphics
      const keepAttributes = [
        'href', 'src', 'alt', 'colspan', 'rowspan', 'class',
        // SVG attributes
        'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
        'stroke-linejoin', 'd', 'width', 'height', 'x', 'y', 'cx', 'cy',
        'r', 'rx', 'ry', 'transform', 'opacity', 'fill-rule', 'clip-rule'
      ];
      Array.from(el.attributes).forEach(attr => {
        if (!keepAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}

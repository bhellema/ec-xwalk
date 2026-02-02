var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-about-us-page.js
  var import_about_us_page_exports = {};
  __export(import_about_us_page_exports, {
    default: () => import_about_us_page_default
  });

  // tools/importer/parsers/cards-company.js
  function parse(element, { document }) {
    const cards = Array.from(element.querySelectorAll(".card"));
    const cells = [];
    cards.forEach((card) => {
      const cardImageDiv = card.querySelector(".card-image");
      let imageElement = null;
      if (cardImageDiv) {
        const svg = cardImageDiv.querySelector("svg");
        if (svg) {
          imageElement = svg;
          console.log("Found SVG for card:", svg.outerHTML.substring(0, 50));
        } else {
          imageElement = cardImageDiv.querySelector("img");
          if (!imageElement) {
            console.log("No image found in card-image div. innerHTML:", cardImageDiv.innerHTML.substring(0, 100));
          }
        }
      } else {
        console.log("No .card-image div found in card");
      }
      const title = card.querySelector(".title");
      const contentDiv = card.querySelector(".card-content .content");
      const footerLink = card.querySelector(".card-footer");
      if (!title) {
        return;
      }
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (imageElement) {
        const p = document.createElement("p");
        if (imageElement.tagName.toLowerCase() === "svg") {
          const serializer = new XMLSerializer();
          let svgString = serializer.serializeToString(imageElement);
          if (!svgString.includes("xmlns=")) {
            svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const blobUrl = URL.createObjectURL(svgBlob);
          const img = document.createElement("img");
          img.src = blobUrl;
          img.alt = "Company logo";
          if (imageElement.hasAttribute("width")) {
            img.setAttribute("width", imageElement.getAttribute("width"));
          }
          if (imageElement.hasAttribute("height")) {
            img.setAttribute("height", imageElement.getAttribute("height"));
          }
          p.appendChild(img);
          console.log("Created blob URL for SVG:", blobUrl);
        } else {
          const clonedImage = imageElement.cloneNode(true);
          p.appendChild(clonedImage);
        }
        imageCell.appendChild(p);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (title) {
        const h4 = document.createElement("h4");
        h4.textContent = title.textContent.trim();
        textCell.appendChild(h4);
      }
      if (contentDiv) {
        const p = document.createElement("p");
        p.textContent = contentDiv.textContent.trim();
        textCell.appendChild(p);
      }
      if (footerLink) {
        console.log("Found footer link:", footerLink.textContent.trim(), footerLink.href);
        const linkP = document.createElement("p");
        const a = document.createElement("a");
        a.href = footerLink.querySelector("a").href;
        a.textContent = footerLink.textContent.trim();
        linkP.appendChild(a);
        textCell.appendChild(linkP);
        console.log("Added link to textCell");
      } else {
        console.log("No footer link found for card:", title == null ? void 0 : title.textContent);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-company",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/themeateater-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const unwrapSelectors = [
        "#__nuxt",
        "#__layout",
        ".contentCenterDesktop_CkK5D",
        ".contentCenterMobile_aHlnC",
        ".page-container",
        "section.body"
      ];
      unwrapSelectors.forEach((selector) => {
        const wrappers = element.querySelectorAll(selector);
        wrappers.forEach((wrapper) => {
          while (wrapper.firstChild) {
            wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
          }
          wrapper.remove();
        });
      });
      const contentDivs = Array.from(element.querySelectorAll(".content"));
      contentDivs.forEach((contentDiv) => {
        if (!contentDiv.closest(".card")) {
          while (contentDiv.firstChild) {
            contentDiv.parentNode.insertBefore(contentDiv.firstChild, contentDiv);
          }
          contentDiv.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        'link[rel="stylesheet"]',
        'link[href*="fonts.googleapis"]',
        "link",
        ".pageNotice",
        "#pageHeaderSearchBarOffsetTop",
        ".notifications_B9V49",
        "#third-party-modals",
        "#dynamic-react-root",
        '[class*="kl-private-reset-css"]',
        '[class*="needsclick"]',
        '[class*="go1272136950"]',
        '[class*="go249761392"]',
        ".headcrumb"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "header",
        "nav",
        ".pageHeader",
        '[class*="pageHeader"]',
        '[class*="menu_"]',
        '[class*="submenu_"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "body > footer",
        // Only remove page footer, not card footers
        ".pageFooter",
        '[class*="pageFooter"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        '[class*="klaviyo-form"]',
        '[class*="klaviyo-close"]',
        '[class*="klaviyo-"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#ae_app",
        ".audioeye-skip-link",
        "#audioeye_new_window_message",
        "#audioeye_notification_message",
        "[data-audioeye-lang]",
        '[class*="audioeye"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".searchModal_X1b\\+g",
        '[class*="searchModal"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        '[class*="group_iTTa7"]',
        '[class*="group_l7I2m"]',
        '[class*="item_FnX10"]',
        '[class*="dropdown_"]',
        '[class*="section_LVlLx"]',
        '[class*="backdrop_"]',
        '[class*="linkContainer_"]'
      ]);
      const body = element.querySelector("body");
      if (body && body.classList.contains("klaviyo-prevent-body-scrolling")) {
        body.classList.remove("klaviyo-prevent-body-scrolling");
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        'link[rel="stylesheet"]',
        "noscript",
        "iframe"
      ]);
      const body = element.querySelector("body") || element;
      const removeWrapperDivs = (parent) => {
        const divs = Array.from(parent.querySelectorAll(":scope > div"));
        divs.forEach((div) => {
          const isBlock = div.className && /^[a-z]+(-[a-z]+)*$/.test(div.className);
          const isInsideTable = div.closest("table") !== null;
          if (!isBlock && !isInsideTable) {
            while (div.firstChild) {
              parent.insertBefore(div.firstChild, div);
            }
            div.remove();
          }
        });
      };
      for (let i = 0; i < 5; i++) {
        removeWrapperDivs(body);
      }
      const walker = element.ownerDocument.createTreeWalker(
        body,
        128,
        // NodeFilter.SHOW_COMMENT
        null,
        false
      );
      const commentsToRemove = [];
      let node;
      while (node = walker.nextNode()) {
        const commentText = node.textContent.trim();
        if (!commentText.startsWith("field:")) {
          commentsToRemove.push(node);
        }
      }
      commentsToRemove.forEach((comment) => comment.remove());
      const standaloneParagraphs = Array.from(body.querySelectorAll("p")).filter((p) => {
        var _a, _b;
        const parentTable = p.closest("table");
        if (parentTable && ((_b = (_a = parentTable.querySelector("th")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.includes("-"))) {
          return false;
        }
        if (p.closest(".metadata")) {
          return false;
        }
        const text = p.textContent.trim();
        if (text.length <= 3 || text === "X") {
          return true;
        }
        return false;
      });
      standaloneParagraphs.forEach((p) => p.remove());
      const allDivs = Array.from(body.querySelectorAll("div"));
      allDivs.forEach((div) => {
        const isInsideBlock = div.parentElement && div.parentElement.className && /^[a-z]+(-[a-z]+)*$/.test(div.parentElement.className);
        const isBlockChild = div.parentElement && div.parentElement.parentElement && div.parentElement.parentElement.className && /^[a-z]+(-[a-z]+)*$/.test(div.parentElement.parentElement.className);
        if (!isInsideBlock && !isBlockChild && !div.textContent.trim() && div.querySelectorAll("img, table, figure").length === 0) {
          div.remove();
        }
      });
      const allElements = body.querySelectorAll("*");
      allElements.forEach((el) => {
        if (el.className && !/^[a-z]+(-[a-z]+)*$/.test(el.className)) {
          el.removeAttribute("class");
        }
        const keepAttributes = [
          "href",
          "src",
          "alt",
          "colspan",
          "rowspan",
          "class",
          // SVG attributes
          "xmlns",
          "viewBox",
          "fill",
          "stroke",
          "stroke-width",
          "stroke-linecap",
          "stroke-linejoin",
          "d",
          "width",
          "height",
          "x",
          "y",
          "cx",
          "cy",
          "r",
          "rx",
          "ry",
          "transform",
          "opacity",
          "fill-rule",
          "clip-rule"
        ];
        Array.from(el.attributes).forEach((attr) => {
          if (!keepAttributes.includes(attr.name)) {
            el.removeAttribute(attr.name);
          }
        });
      });
    }
  }

  // tools/importer/import-about-us-page.js
  var parsers = {
    "cards-company": parse
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "about-us-page",
    description: "About Us page with company information",
    urls: [
      "https://www.themeateater.com/about-us",
      "http://themeateater.com/about-us"
    ],
    blocks: [
      {
        name: "cards-company",
        instances: [".columns"]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, payload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
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
  var import_about_us_page_default = {
    /**
     * Main transformation function
     * Transforms the about-us page from source HTML to AEM format
     */
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
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
      executeTransformers("afterTransform", main, payload);
      const blocks = main.querySelectorAll('div[class*="-"]');
      blocks.forEach((block) => {
        if (block.className && /^[a-z]+(-[a-z]+)*$/.test(block.className)) {
          const hrBefore = document.createElement("hr");
          block.parentNode.insertBefore(hrBefore, block);
          const hrAfter = document.createElement("hr");
          if (block.nextSibling) {
            block.parentNode.insertBefore(hrAfter, block.nextSibling);
          } else {
            block.parentNode.appendChild(hrAfter);
          }
        }
      });
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_about_us_page_exports);
})();

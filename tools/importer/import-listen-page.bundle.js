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

  // import-listen-page.js
  var import_listen_page_exports = {};
  __export(import_listen_page_exports, {
    default: () => import_listen_page_default
  });

  // parsers/cards-podcast.js
  function parse(element, { document }) {
    const cards = Array.from(
      element.querySelectorAll(".podcast_P6efM") || element.querySelectorAll('[class*="podcast"]') || element.querySelectorAll(":scope > div")
    );
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector("img") || card.querySelector("picture img") || card.querySelector('[class*="fillRelativePosition"] img');
      const link = card.querySelector("a") || card.querySelector('[class*="link"]');
      let textContent = "";
      if (img && img.alt) {
        textContent = img.alt;
      } else if (link && link.textContent.trim()) {
        textContent = link.textContent.trim();
      }
      let textElement;
      if (link && textContent) {
        textElement = document.createElement("p");
        const linkElement = document.createElement("a");
        linkElement.href = link.href;
        linkElement.textContent = textContent;
        textElement.appendChild(linkElement);
      } else if (textContent) {
        textElement = document.createElement("p");
        textElement.textContent = textContent;
      }
      if (img || textElement) {
        const imageCell = document.createDocumentFragment();
        if (img) {
          imageCell.appendChild(document.createComment(" field:image "));
          imageCell.appendChild(img.cloneNode(true));
        }
        const textCell = document.createDocumentFragment();
        if (textElement) {
          textCell.appendChild(document.createComment(" field:text "));
          textCell.appendChild(textElement);
        }
        cells.push([imageCell, textCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-podcast", cells });
    element.replaceWith(block);
  }

  // transformers/themeateater-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "nav",
        ".pageHeader",
        '[class*="pageHeader"]',
        '[class*="menu_"]',
        '[class*="submenu_"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "footer",
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
    }
  }

  // import-listen-page.js
  var parsers = {
    "cards-podcast": parse
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "listen-page",
    urls: [
      "https://www.themeateater.com/listen"
    ],
    description: "Podcast and audio content listing page",
    blocks: [
      {
        name: "cards-podcast",
        instances: [".podcasts_nB1Ll"]
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
  var import_listen_page_default = {
    /**
     * Main transformation function
     * Transforms source HTML to AEM-compatible format
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
          blocks: pageBlocks.map((b) => b.name),
          blockCount: pageBlocks.length
        }
      }];
    }
  };
  return __toCommonJS(import_listen_page_exports);
})();

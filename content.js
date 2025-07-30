let allMistakes = {
  spelling: [],
  grammar: []
};

async function checkSpellingAndGrammar(text) {
  const res = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `text=${encodeURIComponent(text)}&language=en-US`
  });
  const data = await res.json();
  return data.matches;
}

// Check if element is visible
function isVisible(el) {
  if (!el.offsetParent && el.tagName !== 'BODY') return false;
  const style = getComputedStyle(el);
  return style && style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
}

// Recursively get all visible text nodes inside an element
function getTextNodes(node) {
  let textNodes = [];
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim() !== "") textNodes.push(node);
  } else {
    if (node.nodeType === Node.ELEMENT_NODE && !isVisible(node)) return [];
    for (let child of node.childNodes) {
      textNodes = textNodes.concat(getTextNodes(child));
    }
  }
  return textNodes;
}

function getContextText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.trim();
  else return "";
}

async function scanPage() {
  allMistakes = { spelling: [], grammar: [] };
  const url = window.location.href;

  const textNodes = getTextNodes(document.body);
  const inputs = Array.from(document.querySelectorAll("input[placeholder], textarea[placeholder], [aria-label]"));

  let textsToCheck = [];

  textNodes.forEach(tn => {
    if (tn.nodeValue.trim().length >= 3) textsToCheck.push({ node: tn, text: tn.nodeValue.trim(), type: "textNode" });
  });

  inputs.forEach(input => {
    if (input.placeholder && input.placeholder.trim().length >= 3) {
      textsToCheck.push({ node: input, text: input.placeholder.trim(), attr: "placeholder", type: "input" });
    }
    if (input.getAttribute("aria-label") && input.getAttribute("aria-label").trim().length >= 3) {
      textsToCheck.push({ node: input, text: input.getAttribute("aria-label").trim(), attr: "aria-label", type: "input" });
    }
  });

  for (const item of textsToCheck) {
    try {
      const mistakes = await checkSpellingAndGrammar(item.text);
      if (mistakes.length > 0) {
        mistakes.forEach(m => {
          const word = item.text.substr(m.context.offset, m.context.length);
          // Categorize
          if (m.rule.issueType === "misspelling") {
            allMistakes.spelling.push({
              word,
              message: m.message,
              url,
              context: item.text,
            });
          } else {
            // grammar or style errors
            allMistakes.grammar.push({
              word,
              message: m.message,
              url,
              context: item.text,
            });
          }
        });
      }
    } catch (e) {
      console.error("Spell/Grammar check error:", e);
    }
  }
}

// Highlighting spelling mistakes (optional)
function highlightSpellingMistakes() {
  allMistakes.spelling.forEach(mistake => {
    const word = mistake.word;
    // try to highlight in DOM if visible text node available
    // WARNING: complex logic to find and highlight specific word; skipping for simplicity
  });
}

scanPage();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAllMistakes") {
    sendResponse(allMistakes);
  } else if (request.action === "scanPage") {
    scanPage().then(() => sendResponse({ success: true }));
    return true;
  }
});

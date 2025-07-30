const statusEl = document.getElementById("status");
const spellingTbody = document.querySelector("#spelling-table tbody");
const grammarTbody = document.querySelector("#grammar-table tbody");

document.getElementById("scan-page").addEventListener("click", () => {
  statusEl.textContent = "Scanning page for spelling and grammar mistakes...";
  spellingTbody.innerHTML = "";
  grammarTbody.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "scanPage" }, (response) => {
      if (response && response.success) {
        statusEl.textContent = "Scan complete! Click 'Show Mistakes' to view results.";
      } else {
        statusEl.textContent = "Scan failed.";
      }
    });
  });
});

document.getElementById("show-mistakes").addEventListener("click", () => {
  statusEl.textContent = "Loading mistakes...";
  spellingTbody.innerHTML = "";
  grammarTbody.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getAllMistakes" }, (response) => {
      if (!response) {
        statusEl.textContent = "No data found.";
        return;
      }

      // Spelling mistakes
      if (response.spelling && response.spelling.length > 0) {
        response.spelling.forEach(mistake => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${escapeHtml(mistake.word)}</td>
            <td>${escapeHtml(mistake.message)}</td>
            <td class="url">${escapeHtml(mistake.url)}</td>
          `;
          spellingTbody.appendChild(tr);
        });
      } else {
        spellingTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No spelling mistakes found</td></tr>`;
      }

      // Grammar mistakes
      if (response.grammar && response.grammar.length > 0) {
        response.grammar.forEach(mistake => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${escapeHtml(mistake.word)}</td>
            <td>${escapeHtml(mistake.message)}</td>
            <td class="url">${escapeHtml(mistake.url)}</td>
          `;
          grammarTbody.appendChild(tr);
        });
      } else {
        grammarTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No grammar mistakes found</td></tr>`;
      }

      statusEl.textContent = `Found ${response.spelling.length} spelling and ${response.grammar.length} grammar mistakes.`;
    });
  });
});

// Helper to escape HTML
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

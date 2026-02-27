import "./style/main.less";

const HISTORY_PATH = "/history";
const WATCH_HISTORY_URL_REGEX = /\/content\/v2\/[^/]+\/watch-history/;
const watchHistoryEntries: unknown[] = [];

const button = document.createElement("button");
button.id = "itamae-save-btn";
button.textContent = "Save List (0)";

function updateButton() {
  button.textContent = `Save List (${watchHistoryEntries.length})`;
}

// Intercept XMLHttpRequest to capture watch-history API responses
// Based on: https://stackoverflow.com/a/29293383
(function (open: (...args: any[]) => void) {
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _url?: string },
    ...args: any[]
  ) {
    this._url = args[1]?.toString();
    this.addEventListener(
      "load",
      function (this: XMLHttpRequest & { _url?: string }) {
        if (this._url && WATCH_HISTORY_URL_REGEX.test(this._url)) {
          const response = JSON.parse(this.responseText);
          watchHistoryEntries.push(...response.data);
          updateButton();
        }
      },
    );
    open.apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;
})(XMLHttpRequest.prototype.open);

button.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(watchHistoryEntries, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "watch-history.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

function isHistoryPage() {
  return location.pathname === HISTORY_PATH;
}

function attachButton() {
  const h1 = document.querySelector("h1");
  if (h1 && !h1.contains(button)) {
    h1.appendChild(button);
  }
}

// Watch for SPA navigation and attach/detach button accordingly
new MutationObserver(() => {
  if (isHistoryPage()) {
    attachButton();
  } else {
    watchHistoryEntries.length = 0;
    updateButton();
    button.remove();
  }
}).observe(document, { subtree: true, childList: true });

// Initial attach if already on history page
if (isHistoryPage()) {
  const waitForH1 = setInterval(() => {
    const h1 = document.querySelector("h1");
    if (h1) {
      clearInterval(waitForH1);
      h1.appendChild(button);
    }
  }, 200);
}

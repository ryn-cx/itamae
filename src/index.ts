import "./style/main.less";

const HISTORY_PATH = "/history";
const WATCH_HISTORY_URL_REGEX = /\/content\/v2\/[^/]+\/watch-history/;
const watchHistoryEntries: unknown[] = [];

const saveButton = document.createElement("button");
saveButton.id = "itamae-save-btn";
saveButton.textContent = "Save History (0)";

const loadButton = document.createElement("button");
loadButton.id = "itamae-auto-btn";
loadButton.textContent = "Load History";

const loadingModal = document.createElement("div");
loadingModal.id = "itamae-loading-modal";
const loadingModalText = document.createElement("span");
loadingModalText.textContent = "Loading...";
loadingModal.appendChild(loadingModalText);
loadingModal.addEventListener("click", () => stopAutoLoad());

function updateSaveButton() {
  saveButton.textContent = `Save History (${watchHistoryEntries.length})`;
}

function updateLoadingModal() {
  loadingModalText.textContent = `Loading... (${watchHistoryEntries.length})`;
}

let autoLoading = false;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

function stopAutoLoad(completed = false) {
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  loadingModal.remove();
  autoLoading = false;
  if (completed) {
    loadButton.remove();
    window.scrollTo(0, 0);
  }
}

function scrollLoop() {
  if (!autoLoading) return;
  const countBefore = watchHistoryEntries.length;
  window.scrollTo(0, document.body.scrollHeight);
  scrollTimer = setTimeout(() => {
    if (!autoLoading) return;
    if (watchHistoryEntries.length === countBefore) {
      stopAutoLoad(true);
    } else {
      scrollLoop();
    }
  }, 2000);
}

function startAutoLoad() {
  autoLoading = true;
  document.body.appendChild(loadingModal);
  scrollLoop();
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
          updateSaveButton();
          updateLoadingModal();
        }
      },
    );
    open.apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;
})(XMLHttpRequest.prototype.open);

loadButton.addEventListener("click", () => {
  if (!autoLoading) {
    startAutoLoad();
  }
});

saveButton.addEventListener("click", () => {
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
  if (h1 && !h1.contains(saveButton)) {
    h1.appendChild(saveButton);
    h1.appendChild(loadButton);
  }
}

// Watch for SPA navigation and attach/detach saveButton accordingly
new MutationObserver(() => {
  if (isHistoryPage()) {
    attachButton();
  } else {
    watchHistoryEntries.length = 0;
    updateSaveButton();
    saveButton.remove();
    loadButton.remove();
  }
}).observe(document, { subtree: true, childList: true });

// Initial attach if already on history page
if (isHistoryPage()) {
  const waitForH1 = setInterval(() => {
    const h1 = document.querySelector("h1");
    if (h1) {
      clearInterval(waitForH1);
      h1.appendChild(saveButton);
      h1.appendChild(loadButton);
    }
  }, 200);
}

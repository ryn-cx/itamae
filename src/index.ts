import "./style/main.less";

const WATCH_HISTORY_URL_REGEX = /\/content\/v2\/[^/]+\/watch-history/;
const watchHistoryEntries: unknown[] = [];

const button = document.createElement("button");

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

button.id = "itamae-save-btn";
button.textContent = "Save List (0)";

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

const waitForH1 = setInterval(() => {
  const h1 = document.querySelector("h1");
  if (h1) {
    clearInterval(waitForH1);
    h1.appendChild(button);
  }
}, 200);

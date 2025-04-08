chrome.storage.local.get("scriptActivo", (data) => {
  if (data.scriptActivo === undefined) {
      chrome.storage.local.set({ scriptActivo: true }); // Valor por defecto
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
      chrome.storage.local.get("scriptActivo", (data) => {
          if (data.scriptActivo) {
              chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  files: ["content.js"]
              });
          }
      });
  }
});

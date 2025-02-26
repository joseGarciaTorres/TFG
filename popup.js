document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-btn");
  const defaultToggle = document.getElementById("default-toggle");

  // Obtener los valores guardados en chrome.storage
  chrome.storage.local.get(["scriptActivo", "scriptAuto"], (data) => {
      const isScriptActive = data.scriptActivo ?? true;
      const isAutoActive = data.scriptAuto ?? true;

      toggleBtn.checked = isScriptActive;
      defaultToggle.checked = isAutoActive;

      // Si está activado por defecto, asegurarse de que el content.js se inyecta
      if (isAutoActive) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length === 0) return;
              chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  files: ["content.js"]
              });
          });
      }
  });

  // Manejar la activación/desactivación manual
  toggleBtn.addEventListener("change", () => {
      const nuevoEstado = toggleBtn.checked;
      chrome.storage.local.set({ scriptActivo: nuevoEstado });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) return;
          const tabId = tabs[0].id;

          if (nuevoEstado) {
              chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  files: ["content.js"]
              });
          } else {
              chrome.tabs.reload(tabId);
          }
      });
  });

  // Manejar la opción de activar por defecto
  defaultToggle.addEventListener("change", () => {
      const isAutoActive = defaultToggle.checked;
      chrome.storage.local.set({ scriptAuto: isAutoActive });

      // Sincronizar el toggle principal con el nuevo estado por defecto
      toggleBtn.checked = isAutoActive;
      chrome.storage.local.set({ scriptActivo: isAutoActive });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) return;
          const tabId = tabs[0].id;

          if (isAutoActive) {
              chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  files: ["content.js"]
              });
          } else {
              chrome.tabs.reload(tabId);
          }
      });
  });
});

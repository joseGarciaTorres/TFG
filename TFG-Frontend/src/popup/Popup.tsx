import React, { use, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getContent } from '../content/content';

const Popup = () => {
  const [isExtensionActive, setIsExtensionActive] = useState(false); // Estado para el switch on/off


  useEffect(() => {
    getContent().then((content) => setIsExtensionActive(content));
  }
  , []);
  
  const handleOpenSidebar = () => {
    // Enviar un mensaje al content script para abrir el sidebar
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'open_sidebar' });
        window.close(); // Cerrar el popup después de enviar el mensaje
      }
    });
  };

  const toggleExtension = () => {
    const newState = !isExtensionActive;
    setIsExtensionActive(newState);

    // Enviar un mensaje al content script con el nuevo estado
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: newState ? "activate" : "deactivate",
        });
      }
    });
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Extensión</h1>
      <button
        onClick={handleOpenSidebar}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        Abrir Sidebar
      </button>
      <br />
      <button
        onClick={toggleExtension}
        style={{
          padding: '10px 20px',
          backgroundColor: isExtensionActive ? '#FF5722' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {isExtensionActive ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
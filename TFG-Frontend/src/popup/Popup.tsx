import React, { use, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getContent } from '../content/content';
import '../styles/main.css';

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
    <>
      <button
    onClick={handleOpenSidebar}
    className='back-button'
    style={{
      width: '100px',
      height: '50px',
      display: 'inline-block',
      textAlign: 'center',
      lineHeight: '10px',
      margin: '10px',
      borderRadius: '10px',
    }}
  >
    Abrir Panel
  </button>
  <br />
  <button
    onClick={toggleExtension}
    className='search-button'
    style={{
      width: '100px',
      height: '50px',
      display: 'inline-block',
      textAlign: 'center',
      lineHeight: '10px',
      margin: '10px',
      borderRadius: '10px',
    }}
  >
    Activar
    Desactivar
  </button>
  </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
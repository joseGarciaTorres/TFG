import React from "react";

const TextHighlighter: React.FC = () => {
  // Función para aplicar el formato de negrita al texto seleccionado
  const applyBoldToSelection = () => {
    const selection = window.getSelection(); // Obtiene la selección actual del DOM
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0); // Obtiene el rango seleccionado
      const selectedText = range.toString(); // Obtiene el texto seleccionado

      if (selectedText.trim() !== "") {
        // Crea un elemento <b> para envolver el texto seleccionado
        const boldElement = document.createElement("b");
        boldElement.textContent = selectedText;

        // Reemplaza el texto seleccionado por el elemento <b>
        range.deleteContents(); // Borra el texto seleccionado
        range.insertNode(boldElement); // Inserta el elemento <b> en su lugar
      } else {
        alert("Por favor selecciona un texto antes de aplicar el formato.");
      }
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      <button
        onClick={applyBoldToSelection}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Poner en negrita
      </button>
    </div>
  );
};

export default TextHighlighter;
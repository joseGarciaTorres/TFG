import React, { useEffect } from "react";

interface FloatingMenuProps {
  x: number;
  y: number;
  range: Range;
  onClose: () => void;
  onApply: (span: HTMLSpanElement) => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ x, y, range, onClose, onApply }) => {
  useEffect(() => {
    const menu = document.getElementById("floating-menu");
    return () => {
      if (menu) menu.remove();
    };
  }, []);

  const parentNode = range.commonAncestorContainer.parentElement;

  if (!(parentNode instanceof HTMLElement)) {
    console.error("El nodo padre no es un HTMLElement. No se puede aplicar estilos.");
    return null;
  }

  useEffect(() => {
    const textColorPicker = document.getElementById("textColorPicker") as HTMLInputElement;
    const bgColorPicker = document.getElementById("bgColorPicker") as HTMLInputElement;
    const fontSizePicker = document.getElementById("fontSizePicker") as HTMLInputElement;
    const textColorDisplay = document.getElementById("textColorDisplay") as HTMLDivElement;
    const bgColorDisplay = document.getElementById("bgColorDisplay") as HTMLDivElement;

    if (textColorPicker && bgColorPicker && fontSizePicker && textColorDisplay && bgColorDisplay) {
      textColorPicker.value = parentNode.style.color || "#000000";
      bgColorPicker.value = parentNode.style.backgroundColor || "#ffffff";
      fontSizePicker.value = parentNode.style.fontSize.replace("px", "") || "16";

      textColorDisplay.style.backgroundColor = textColorPicker.value;
      bgColorDisplay.style.backgroundColor = bgColorPicker.value;

      textColorPicker.addEventListener("input", () => {
        textColorDisplay.style.backgroundColor = textColorPicker.value;
      });

      bgColorPicker.addEventListener("input", () => {
        bgColorDisplay.style.backgroundColor = bgColorPicker.value;
      });
    }
  }, [parentNode]);

  const handleApply = () => {
    const textColorPicker = document.getElementById("textColorPicker") as HTMLInputElement;
    const bgColorPicker = document.getElementById("bgColorPicker") as HTMLInputElement;
    const fontSizePicker = document.getElementById("fontSizePicker") as HTMLInputElement;

    const span = document.createElement("span");
    span.style.color = textColorPicker.value;
    span.style.backgroundColor = bgColorPicker.value;
    span.style.fontSize = `${fontSizePicker.value}px`;

    const boldButton = document.querySelector('[data-style="bold"]') as HTMLButtonElement;
    const italicButton = document.querySelector('[data-style="italic"]') as HTMLButtonElement;
    const underlineButton = document.querySelector('[data-style="underline"]') as HTMLButtonElement;

    if (boldButton?.classList.contains("active")) {
      span.style.fontWeight = "bold";
    }
    if (italicButton?.classList.contains("active")) {
      span.style.fontStyle = "italic";
    }
    if (underlineButton?.classList.contains("active")) {
      span.style.textDecoration = "underline";
    }

    span.textContent = range.toString();
    range.deleteContents();
    range.insertNode(span);

    onApply(span);
  };

  return (
    <div
      id="floating-menu"
      style={{
        position: "absolute",
        top: `${y}px`,
        left: `${x}px`,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "4px",
        padding: "10px",
        zIndex: 1000,
      }}
    >
      <button data-style="bold"><b>B</b></button>
      <button data-style="italic"><i>I</i></button>
      <button data-style="underline"><u>U</u></button>
      <label className="color-picker-container">
        <input type="color" id="textColorPicker" title="Color del texto" />
        <div className="color-display" id="textColorDisplay" title="Color del texto"></div>
      </label>
      <label className="color-picker-container">
        <input type="color" id="bgColorPicker" title="Color de fondo" />
        <div className="color-display" id="bgColorDisplay" title="Color de fondo"></div>
      </label>
      <input type="number" id="fontSizePicker" min="8" max="72" defaultValue="16" title="Tamaño de letra" />
      <button onClick={handleApply}>✔ Aplicar</button>
      <button onClick={onClose}>❌</button>
    </div>
  );
};

export default FloatingMenu;
let range;

function setRange(rang) {
    console.log("cambia range");
    range = rang;
}

function getRange() {
    return range;
}

document.addEventListener("mouseup", (event) => {
    console.log("hecho");
    if (event.target.closest("#custom-menu")) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const selectedText = selection.toString().trim();

    if (selectedText) {
        setRange(selection.getRangeAt(0));
        const oldMenu = document.getElementById("custom-menu");
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement("div");
        menu.id = "custom-menu";
        menu.style.position = "fixed";
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.background = "white";
        menu.style.border = "1px solid #ccc";
        menu.style.padding = "10px";
        menu.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
        menu.style.borderRadius = "5px";
        menu.style.zIndex = "1000";

        menu.innerHTML = `
            <button data-style="bold"><b>B</b></button>
            <button data-style="italic"><i>I</i></button>
            <button data-style="underline"><u>U</u></button>
            <label class="color-picker-container">
                <input type="color" id="textColorPicker">
                <div class="color-display" id="textColorDisplay" title="Color del texto"></div>
            </label>
            <label class="color-picker-container">
                <input type="color" id="bgColorPicker">
                <div class="color-display" id="bgColorDisplay" title="Color de fondo"></div>
            </label>
            <input type="number" id="fontSizePicker" min="8" max="72" value="16" title="Tamaño de letra">
            <button id="applyChanges">✔ Aplicar</button>
            <button id="closeMenu">❌</button>
        `;

        document.body.appendChild(menu);

        // Obtener estilos actuales del texto seleccionado
        const selectedElement = getRange().commonAncestorContainer.parentElement;
        document.getElementById("textColorPicker").value = rgbToHex(window.getComputedStyle(selectedElement).color);
        document.getElementById("bgColorPicker").value = rgbToHex(window.getComputedStyle(selectedElement).backgroundColor);
        document.getElementById("fontSizePicker").value = parseInt(window.getComputedStyle(selectedElement).fontSize);

        document.getElementById("textColorDisplay").style.backgroundColor = document.getElementById("textColorPicker").value;
        document.getElementById("bgColorDisplay").style.backgroundColor = document.getElementById("bgColorPicker").value;
        
        let textColor = null;
        let bgColor = null;
        let fontSize = null;

        // Eventos de botones de formato
        menu.querySelector("[data-style='bold']").addEventListener("click", () => aplicarEstilo("bold", getRange(), 1));
        menu.querySelector("[data-style='italic']").addEventListener("click", () => aplicarEstilo("italic", getRange(), 1));
        menu.querySelector("[data-style='underline']").addEventListener("click", () => aplicarEstilo("underline", getRange(), 1));

        // Eventos de selección de color y tamaño
        menu.querySelector("#textColorPicker").addEventListener("input", (e) => {
            textColor = e.target.value;
            document.getElementById("textColorDisplay").style.backgroundColor = textColor;
        });

        menu.querySelector("#bgColorPicker").addEventListener("input", (e) => {
            bgColor = e.target.value;
            document.getElementById("bgColorDisplay").style.backgroundColor = bgColor;
        });

        menu.querySelector("#fontSizePicker").addEventListener("input", (e) => fontSize = `${e.target.value}px`);

        // Aplicar cambios confirmados
        menu.querySelector("#applyChanges").addEventListener("click", () => {
            if (textColor !== null) aplicarEstilo("color", getRange(), textColor);
            if (bgColor !== null) aplicarEstilo("backgroundColor", getRange(), bgColor);
            if (fontSize !== null) aplicarEstilo("fontSize", getRange(), fontSize);
            menu.remove();
        });

        // Cerrar menú
        menu.querySelector("#closeMenu").addEventListener("click", () => menu.remove());
    }
});

// Función para aplicar los estilos al texto seleccionado
function aplicarEstilo(estilo, range, valor = null) {
    if (!range) return;

    const selectedContent = range.extractContents();

    let span;
    span = document.createElement("span");
    switch (estilo) {
        case "bold":
            span.style.fontWeight = span.style.fontWeight === "bold" ? "normal" : "bold";
            break;
        case "italic":
            span.style.fontStyle = span.style.fontStyle === "italic" ? "normal" : "italic";
            break;
        case "underline":
            span.style.textDecoration = span.style.textDecoration.includes("underline") ? "none" : "underline";
            break;
        case "color":
            span.style.color = valor;
            break;
        case "backgroundColor":
            span.style.backgroundColor = valor;
            break;
        case "fontSize":
            span.style.fontSize = valor;
            break;
    }

    span.appendChild(selectedContent);
    range.insertNode(span);
    window.getSelection().removeAllRanges();
}

// Convertir color RGB a HEX
function rgbToHex(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match) return "#000000";
    return `#${match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, "0")).join("")}`;
}

// Estilos CSS
const style = document.createElement("style");
style.innerHTML = `
    .color-picker-container {
        display: inline-block;
        position: relative;
        width: 24px;
        height: 24px;
        margin: 2px;
    }

    .color-picker-container input {
        position: absolute;
        width: 24px;
        height: 24px;
        opacity: 0;
        cursor: pointer;
    }

    .color-display {
        width: 24px;
        height: 24px;
        border: 1px solid #000;
        background-color: #fff;
    }
`;
document.head.appendChild(style);

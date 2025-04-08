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

function aplicarEstilo(estilo, range, valor = null) {
    if (!range) return;

    let selectedContent = range.extractContents();
    let parentElement = range.commonAncestorContainer.parentElement;
    
    // Buscar el span modificado más cercano en la selección
    let existingSpan = parentElement.closest(".modificado");

    if (!existingSpan) {
        // Si no hay un span existente, creamos uno nuevo
        existingSpan = document.createElement("span");
        existingSpan.classList.add("modificado");
        range.insertNode(existingSpan);
    }

    // Aplicar los estilos nuevos o modificar los existentes
    switch (estilo) {
        case "bold":
            existingSpan.style.fontWeight = existingSpan.style.fontWeight === "bold" ? "normal" : "bold";
            break;
        case "italic":
            existingSpan.style.fontStyle = existingSpan.style.fontStyle === "italic" ? "normal" : "italic";
            break;
        case "underline":
            existingSpan.style.textDecoration = existingSpan.style.textDecoration.includes("underline") ? "none" : "underline";
            break;
        case "color":
            existingSpan.style.color = valor;
            break;
        case "backgroundColor":
            existingSpan.style.backgroundColor = valor;
            break;
        case "fontSize":
            existingSpan.style.fontSize = valor;
            break;
    }

    // Añadir el contenido seleccionado al span existente
    existingSpan.appendChild(selectedContent);
    
    // Limpiar la selección
    window.getSelection().removeAllRanges();
}



// Convertir color RGB a HEX
function rgbToHex(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match) return "#000000";
    return `#${match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, "0")).join("")}`;
}

document.addEventListener("mouseover", (event) => {
    if (event.target.classList.contains("modificado")) {
        // Si no tiene backgroundColor definido, se le asigna uno
        if (!event.target.style.backgroundColor) {
            event.target.dataset.originalColor = event.target.style.backgroundColor;
            event.target.style.backgroundColor = "#ffff99";
        }
        else
            event.target.dataset.originalColor = event.target.style.backgroundColor;
        event.target.style.backgroundColor = darkenColor(event.target.dataset.originalColor);
    }
});

document.addEventListener("mouseout", (event) => {
    if (event.target.classList.contains("modificado")) {
        event.target.style.backgroundColor = event.target.dataset.originalColor;
    }
});


document.addEventListener("click", (event) => {
    const modificadoElement = event.target.closest(".modificado");

    if (modificadoElement) {
        // Eliminar todos los botones de eliminación existentes en otros elementos
        document.querySelectorAll(".delete-modification").forEach(button => button.remove());

    
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "❌";
        deleteButton.classList.add("delete-modification");
        deleteButton.addEventListener("click", (e) => {
            event.target.replaceWith(...event.target.childNodes);

            modificadoElement.querySelectorAll("span.modificado").forEach(span => {
                span.replaceWith(...span.childNodes);
            });

            deleteButton.remove();
        });

        modificadoElement.appendChild(deleteButton);
        
    }
});

function darkenColor(color) {
    if (!color || color === "transparent") return "#dddddd";
    const match = color.match(/\d+/g);
    if (!match) return "#dddddd";
    return `rgb(${match.slice(0, 3).map(x => Math.max(0, parseInt(x) - 40)).join(",")})`;
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

    .modificado {
        position: relative;
        display: inline-block;
    }
    .delete-modification {
        position: absolute;
        top: -5px;
        right: -10px;
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

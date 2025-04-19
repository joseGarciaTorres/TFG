import { createRoot } from "react-dom/client";
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from '../utils/axiosInstance'
import CryptoJS from "crypto-js";

interface infoEntidad {
  id: number
  url: string
}

interface infoInterac {
  id: number
  privado: boolean
  numero_interacciones: number
  numero_usuarios_visualizan: number
  numero_usuarios_editan: number
  entidad: number
  owner: number
  usuarios_realizan:number[]
  usuarios_visualizan: number[]
}

interface infoElem {
  id: number
  entidad: number
  ruta_dom: string
  hash_contenido: string
  selected: boolean
}

interface infoModifText {
  id: number;
  fecha: string;
  tamaño_letra: string;
  color_letra: string;
  color_fondo_letra: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  inicio: number;
  fin: number;
  textoOriginal: string;
  textoModificado: string;
  interaccion: number;
  elemento: number;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(
    () => JSON.parse(localStorage.getItem("isSidebarVisible") || "true") // Leer el estado inicial desde Local Storage
  );
  let lastSelectedText = "";
  let entidadId: number | null = null;
  let interaccionId: number | null = null;

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Función para alternar la visibilidad de la sidebar
  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    localStorage.setItem("isSidebarVisible", JSON.stringify(newVisibility)); // Guardar el estado en Local Storage
  };

  // Función para calcular la ruta relativa del DOM
  const calculateDomPath = (element: HTMLElement): string => {
    const parts = [];
    while (element.parentElement) {
      let selector = element.tagName.toLowerCase();

      if (element.id) {
        selector += `#${element.id}`;
        parts.unshift(selector);
        break;
      }

      if (element.className) {
        const classes = element.className.split(/\s+/).join('.');
        selector += `.${classes}`;
      }

      const siblings = Array.from(element.parentElement.children).filter(
        (sibling) => sibling.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-of-type(${index})`;
      }

      parts.unshift(selector);
      element = element.parentElement;
    }

    return parts.join(' > ');
  };

  // Función para generar un hash del contenido del elemento
  const generateHash = (content: string): string => {
    return CryptoJS.SHA256(content).toString(); // Generar hash usando crypto-js
  };

  // Función para crear o obtener la entidad
  const createOrGetEntidad = async (url: string): Promise<number> => {
    if (entidadId) return entidadId;

    try {
      const response = await axios.post<infoEntidad>('/interaction/entidad/', { url });
      entidadId = response.data.id;
      return entidadId;
    } catch (error) {
      console.error('Error al crear/obtener la entidad:', error);
      throw error;
    }
  };

  // Función para crear o obtener la interacción
  const createInteraccion = async (): Promise<number> => {
    if (interaccionId) return interaccionId;

    try {
      const response = await axios.post<infoInterac>('/interaction/crear/', {
        entidad: entidadId,
      });
      interaccionId = response.data.id;
      return interaccionId;
    } catch (error) {
      console.error('Error al crear la interacción:', error);
      throw error;
    }
  };

  // Función para crear el elemento
  const createElemento = async (rutaDom: string, hashContenido: string): Promise<number> => {
    try {
      const response = await axios.post<infoElem>('/interaction/elemento/crear/', {
        entidad_id: entidadId,
        ruta_dom: rutaDom,
        hash_contenido: hashContenido,
      });
      return response.data.id;
    } catch (error) {
      console.error('Error al crear el elemento:', error);
      throw error;
    }
  };


  // Función para obtener los elementos de la interacción
  const getElementos = async (interaccionId: number): Promise<infoElem[]> => {
    try {
      const response = await axios.get<infoElem[]>(`/interaction/${interaccionId}/elementos/`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener los elementos:", error);
      throw error;
    }
  };

  // Función para crear la modificación
  const createModificacion = async (
    elementoId: number,
    tamanioLetra: string,
    colorLetra: string,
    colorFondoLetra: string,
    boldChanged: boolean,
    italicChanged: boolean,
    underlineChanged: boolean,
    inicio: number,
    fin: number,
    textoOriginal: string,
    textoModificado: string
  ): Promise<{ id: number }> => {
    try {
      const response = await axios.post<infoModifText>('/modification/texto/crear/', {
        interaccion: interaccionId,
        elemento: elementoId,
        tamaño_letra: tamanioLetra,
        color_letra: colorLetra,
        color_fondo_letra: colorFondoLetra,
        bold_changed: boldChanged,
        italic_changed: italicChanged,
        underline_changed: underlineChanged,
        inicio,
        fin,
        textoModificado,
      });
      return response.data; // Devuelve la respuesta
    } catch (error) {
      console.error('Error al crear la modificación:', error);
      throw error; // Lanza el error si ocurre
    }
  };

  // Función para obtener las modificaciones de la interacción
  const getModificaciones = async (interaccionId: number): Promise<infoModifText[]> => {
    try {
      const response = await axios.get<{ texto: infoModifText[] }>(`/modification/${interaccionId}/modificaciones/`);
      return response.data.texto;
    } catch (error) {
      console.error("Error al obtener las modificaciones:", error);
      throw error;
    }
  };


  // Función para aplicar las modificaciones a los elementos
  const applyModificationsToElements = async () => {
    const url = window.location.href;
  
    try {
      // Paso 1: Obtener la interacción
      await createOrGetEntidad(url);
      const interaccionId = await createInteraccion();
      if (!interaccionId) return; // No hay interacción, no se aplica nada
  
      // Paso 2: Obtener los elementos
      const elementos = await getElementos(interaccionId);
  
      // Paso 3: Obtener las modificaciones
      const modificaciones = await getModificaciones(interaccionId);
  
      // Paso 4: Aplicar las modificaciones a los elementos
      modificaciones.forEach((mod) => {
        const elemento = elementos.find((el) => el.id === mod.elemento);
        if (elemento) {
          const targetElement = document.querySelector(elemento.ruta_dom) as HTMLElement;
          if (targetElement) {
            // Obtener el rango de texto afectado
            const range = document.createRange();
            const walker = document.createTreeWalker(
              targetElement,
              NodeFilter.SHOW_TEXT,
              null
            );
  
            let currentOffset = 0;
            let startNode: Text | null = null;
            let endNode: Text | null = null;
            let startOffset = 0;
            let endOffset = 0;
  
            // Encontrar los nodos afectados por la modificación
            while (walker.nextNode()) {
              const textNode = walker.currentNode as Text;
              const textLength = textNode.textContent?.length || 0;
  
              // Detectar nodo de inicio
              if (!startNode && currentOffset + textLength > mod.inicio) {
                startNode = textNode;
                startOffset = mod.inicio - currentOffset;
              }
  
              // Detectar nodo de fin
              if (!endNode && currentOffset + textLength >= mod.fin) {
                endNode = textNode;
                endOffset = mod.fin - currentOffset;
                break;
              }
  
              currentOffset += textLength;
            }
  
            if (startNode && endNode) {
              // Configurar el rango para abarcar los nodos afectados
              range.setStart(startNode, startOffset);
              range.setEnd(endNode, endOffset);
  
              const fragment = range.extractContents(); // Extraer contenido afectado
              const span = document.createElement("span");
  
              // Aplicar estilos al span
              if (mod.tamaño_letra) span.style.fontSize = mod.tamaño_letra;
              if (mod.color_letra) span.style.color = mod.color_letra;
              if (mod.color_fondo_letra) span.style.backgroundColor = mod.color_fondo_letra;
              if (mod.bold) span.style.fontWeight = "bold";
              if (mod.italic) span.style.fontStyle = "italic";
              if (mod.underline) span.style.textDecoration = "underline";

              // Añadir el ID de la modificación como un atributo en el span
              span.setAttribute("data-modification-id", mod.id.toString());
  
              span.appendChild(fragment); // Envolver el contenido modificado en el span
              range.insertNode(span); // Insertar el contenido modificado de vuelta en el DOM
              addHighlightAndDeleteFeature(span);
            }
          }
        }
      });
    } catch (error) {
      console.error("Error aplicando las modificaciones:", error);
    }
  };

  // Función que se ejecuta al aplicar los cambios desde el menú flotante
  const applyChanges = async (
    element: HTMLElement,
    tamanioLetra: string,
    colorLetra: string,
    colorFondoLetra: string,
    boldChanged: boolean,
    italicChanged: boolean,
    underlineChanged: boolean,
    inicio: number,
    fin: number,
    textoOriginal: string,
    textoModificado: string
  ) => {
    const url = window.location.href;

    try {
      // Paso 1: Crear o obtener la entidad
      await createOrGetEntidad(url);

      // Paso 2: Crear la interacción
      await createInteraccion();

      // Paso 3: Crear el elemento
      const rutaDom = calculateDomPath(element);
      const hashContenido = generateHash(textoOriginal);
      const elementoId = await createElemento(rutaDom, hashContenido);

      // Paso 4: Crear la modificación
      const response = await createModificacion(
        elementoId,
        tamanioLetra,
        colorLetra,
        colorFondoLetra,
        boldChanged,
        italicChanged,
         underlineChanged, 
        inicio,
        fin,
        textoOriginal,
        textoModificado
      );

      const modificationId = response.id;

      // Añadir el ID de la modificación al span (ya creado en el frontend)
      const span = document.querySelector(`[data-temp-modification]`) as HTMLElement;
      if (span) {
        span.removeAttribute("data-temp-modification");
        span.setAttribute("data-modification-id", modificationId.toString());
      }

    } catch (error) {
      console.error('Error en el proceso de guardar modificaciones:', error);
    }
  };

  // Función para resaltar y permitir eliminar modificaciones
  const addHighlightAndDeleteFeature = (element: HTMLElement) => {
    // Guardar el color de fondo original para restaurarlo después
    const originalBackgroundColor = element.style.backgroundColor;
  
    // Agregar eventos de mouseover y mouseout para resaltar
    element.addEventListener("mouseover", () => {
      element.style.backgroundColor = "rgba(255, 255, 0, 0.3)"; // Color sutil de resalte
    });
  
    element.addEventListener("mouseout", () => {
      element.style.backgroundColor = originalBackgroundColor; // Restaurar el color original
    });
  
    // Agregar evento click para mostrar el botón de eliminación
    const handleClickOutside = (e: MouseEvent) => {
      if (!element.contains(e.target as Node)) {
        const deleteButton = element.querySelector(".delete-button");
        if (deleteButton) deleteButton.remove(); // Eliminar el botón de eliminar
        document.removeEventListener("click", handleClickOutside);
      }
    };
  
    element.addEventListener("click", () => {
      if (!element.querySelector(".delete-button")) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = ""; // Botón sin texto visible
        deleteButton.className = "delete-button";
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "0";
        deleteButton.style.right = "0";
        deleteButton.style.background = "red";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.borderRadius = "50%";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.fontSize = "12px";
        deleteButton.style.width = "20px";
        deleteButton.style.height = "20px";
        deleteButton.style.zIndex = "10";
  
        // Evento para eliminar la modificación
        deleteButton.addEventListener("click", async (e) => {
          e.stopPropagation(); // Evitar que el evento se propague al elemento padre

          // Obtener el ID de la modificación desde el atributo del span
          const modificationId = element.getAttribute("data-modification-id");

          if (modificationId) {
            try {
              // Realizar la solicitud DELETE al backend
              await axios.delete(`/modification/texto/${modificationId}/eliminar-texto/`);
              console.log(`Modificación con ID ${modificationId} eliminada del backend.`);
            } catch (error) {
              console.error(`Error al eliminar la modificación con ID ${modificationId}:`, error);
            }
          }
  
          // Reemplazar el span con su contenido original
          const parent = element.parentNode;
          if (parent) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element); // Mover todos los nodos hijos fuera del span
            }
            parent.removeChild(element); // Eliminar el span
          }
  
          // Eliminar el botón de eliminación
          deleteButton.remove();
        });
  
        // Añadir el botón de eliminación al elemento
        element.style.position = "relative"; // Asegurarse de que el elemento tenga posición relativa
        element.appendChild(deleteButton);
        document.addEventListener("click", handleClickOutside); // Detectar clic fuera del elemento
      }
    });
  };

  // Función que crea y muestra el menú flotante
  const showFloatingMenu = (x: number, y: number, range: Range) => {
    // Elimina cualquier menú flotante existente
    const existingMenu = document.getElementById("floating-menu");
    if (existingMenu) existingMenu.remove();

    // Obtiene el nodo padre del texto seleccionado
    const parentNode = range.commonAncestorContainer.parentElement;

    if (!(parentNode instanceof HTMLElement)) {
      console.error("El nodo padre no es un HTMLElement. No se puede aplicar estilos.");
      return;
    }

    // Crea el contenedor del menú
    const menu = document.createElement("div");
    menu.id = "floating-menu";
    menu.style.position = "absolute";
    menu.style.top = `${y + window.scrollY}px`;
    menu.style.left = `${x + window.scrollX}px`;
    menu.style.backgroundColor = "#fff";
    menu.style.border = "1px solid #ccc";
    menu.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    menu.style.borderRadius = "4px";
    menu.style.padding = "10px";
    menu.style.zIndex = "1000";

    // Contenido del menú
    menu.innerHTML = `
      <button data-style="bold"><b>B</b></button>
      <button data-style="italic"><i>I</i></button>
      <button data-style="underline"><u>U</u></button>
      <label class="color-picker-container">
          <input type="color" id="textColorPicker" title="Color del texto">
          <div class="color-display" id="textColorDisplay" title="Color del texto"></div>
      </label>
      <label class="color-picker-container">
          <input type="color" id="bgColorPicker" title="Color de fondo">
          <div class="color-display" id="bgColorDisplay" title="Color de fondo"></div>
      </label>
      <input type="number" id="fontSizePicker" min="8" max="72" value="16" title="Tamaño de letra">
      <button id="applyChanges">✔ Aplicar</button>
      <button id="closeMenu">❌</button>
    `;

    // Inicializa los valores del menú según el texto seleccionado
    const textColorPicker = menu.querySelector("#textColorPicker") as HTMLInputElement;
    const bgColorPicker = menu.querySelector("#bgColorPicker") as HTMLInputElement;
    const fontSizePicker = menu.querySelector("#fontSizePicker") as HTMLInputElement;
    const textColorDisplay = menu.querySelector("#textColorDisplay") as HTMLDivElement;
    const bgColorDisplay = menu.querySelector("#bgColorDisplay") as HTMLDivElement;

    textColorPicker.value = parentNode.style.color || "#000000";
    bgColorPicker.value = parentNode.style.backgroundColor || "#ffffff";
    fontSizePicker.value = parentNode.style.fontSize.replace("px", "") || "16";

    // Actualiza los colores del display del menú
    textColorDisplay.style.backgroundColor = textColorPicker.value;
    bgColorDisplay.style.backgroundColor = bgColorPicker.value;

    // Variables para rastrear si el usuario interactuó con los colorPickers
    let textColorChanged = false;
    let bgColorChanged = false;
    let fontSizeChanged = false;
    let boldChanged = false;
    let underlineChanged = false;
    let italicChanged = false;

    // Escucha cambios en los colorPickers
    textColorPicker.addEventListener("input", () => {
      textColorChanged = true;
      textColorDisplay.style.backgroundColor = textColorPicker.value;
    });

    bgColorPicker.addEventListener("input", () => {
      bgColorChanged = true;
      bgColorDisplay.style.backgroundColor = bgColorPicker.value;
    });

    fontSizePicker.addEventListener("input", () => {
      fontSizeChanged = true;
    });

    // Lógica para aplicar los cambios al texto seleccionadotextColor
    menu.querySelector("#applyChanges")?.addEventListener("click", () => {
      const span = document.createElement("span");
      // Solo aplicar cambios de color si el usuario interactuó con los colorPickers
      if (textColorChanged) {
        span.style.color = textColorPicker.value;
      } else {
        span.style.color = parentNode.style.color; // Mantener el color actual
      }

      if (bgColorChanged) {
        span.style.backgroundColor = bgColorPicker.value;
      } else {
        span.style.backgroundColor = parentNode.style.backgroundColor; // Mantener el fondo actual
      }
      if (fontSizeChanged){
        span.style.fontSize = `${fontSizePicker.value}px`;
      }
      else{
        span.style.fontSize = parentNode.style.fontSize;
      }

      // Aplica estilos según los botones seleccionados
      const boldButton = menu.querySelector('[data-style="bold"]') as HTMLButtonElement;
      const italicButton = menu.querySelector('[data-style="italic"]') as HTMLButtonElement;
      const underlineButton = menu.querySelector('[data-style="underline"]') as HTMLButtonElement;

      if (boldButton?.classList.contains("active")) {
        span.style.fontWeight = "bold";
        boldChanged = true;
      }
      if (italicButton?.classList.contains("active")) {
        span.style.fontStyle = "italic";
        italicChanged = true;
      }
      if (underlineButton?.classList.contains("active")) {
        span.style.textDecoration = "underline";
        underlineChanged = true;
      }

      span.textContent = range.toString();
      range.deleteContents();
      range.insertNode(span);

      if (parentNode) {
        const textoOriginal = parentNode.textContent || '';
        const inicio = textoOriginal.indexOf(lastSelectedText);
        const fin = inicio + lastSelectedText.length;

        applyChanges(
          parentNode,
          span.style.fontSize, // Tamaño letra 
          span.style.color, // Color letra 
          span.style.backgroundColor, // Color fondo letra 
          //"bold", // Estilo letra
          boldChanged,
          italicChanged,
          underlineChanged, 
          inicio,
          fin,
          textoOriginal,
          lastSelectedText // Texto modificado 
        );
      }


      // Añadir funcionalidades de resaltar y eliminar
      addHighlightAndDeleteFeature(span);

      lastSelectedText = "";
      menu.remove();
    });

    // Botones de formato (negrita, cursiva, subrayado)
    menu.querySelectorAll("button[data-style]").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        button.classList.toggle("active");
      });
    });

    // Lógica para cerrar el menú
    menu.querySelector("#closeMenu")?.addEventListener("click", () => {
      menu.remove();
    });

    document.body.appendChild(menu);
  };

  // Detectar selección de texto y mostrar el menú
  document.addEventListener("mouseup", (event) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
        // Muestra el menú flotante cerca de la selección
        const { clientX: x, clientY: y } = event;
        showFloatingMenu(x, y, range);
      }
    }
  });

  useEffect(() => {
    applyModificationsToElements();
  }, []);

  return (
    <>
      {/* Sidebar */}
      {isSidebarVisible && (
        <div
          id="tfg-sidebar-root"
          style={{
            position: "fixed",
            top: "0",
            right: "0",
            width: "300px",
            height: "100vh",
            zIndex: "9999",
            backgroundColor: "white",
            boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <Sidebar isLoggedIn={isLoggedIn} onLogin={handleLogin} />
        </div>
      )}

      {/* Botón para mostrar/ocultar la sidebar */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: "10000",
          backgroundColor: isSidebarVisible ? "red" : "green",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          cursor: "pointer",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          opacity: "0.5", // Botón más transparente por defecto
          transition: "opacity 0.3s ease", // Suavizar la transición
        }}
        title={isSidebarVisible ? "Ocultar Sidebar" : "Mostrar Sidebar"}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} // Opacidad completa al pasar el ratón
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")} // Volver a ser transparente al quitar el ratón
      >
        {isSidebarVisible ? "X" : "☰"}
      </button>
    </>
  );
};

// Crear un contenedor para el sidebar
// const container = document.createElement("div");
// container.id = "tfg-sidebar-root";
// container.style.position = "fixed";
// container.style.top = "0";
// container.style.right = "0";
// container.style.width = "300px";
// container.style.height = "100vh";
// container.style.zIndex = "9999";
// container.style.backgroundColor = "white";
// container.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.1)";
// document.body.appendChild(container);

// // Renderizar el componente React (sidebar)
// const root = createRoot(container);
// root.render(<App />);

// Renderizar el componente React (sidebar)
const container = document.createElement("div");
container.id = "root";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);
// import { useEffect, useRef, useState } from 'react';

// interface Position {
//   top: number;
//   left: number;
// }

// const FloatingFormatToolbar: React.FC = () => {
//   const [isVisible, setIsVisible] = useState<boolean>(false);
//   const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
//   const toolbarRef = useRef<HTMLDivElement | null>(null);
//   const [selectedText, setSelectedText] = useState<string>('');

//   useEffect(() => {
//     const handleSelection = () => {
//       const selection = window.getSelection();
//       const text = selection?.toString() || '';

//       if (text.length > 0) {
//         const range = selection?.getRangeAt(0);
//         const rect = range?.getBoundingClientRect();

//         if (rect) {
//           setSelectedText(text);
//           setPosition({
//             top: rect.top + window.scrollY - 40,
//             left: rect.left + window.scrollX,
//           });
//           setIsVisible(true);
//         }
//       } else {
//         setIsVisible(false);
//       }
//     };

//     const handleClickOutside = (event: MouseEvent) => {
//       if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
//         setIsVisible(false);
//       }
//     };

//     document.addEventListener('mouseup', handleSelection);
//     document.addEventListener('mousedown', handleClickOutside);

//     return () => {
//       document.removeEventListener('mouseup', handleSelection);
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // if (!isVisible) {
//   //   return null;
//   // }

//   // return (
//   //   <div
//   //     ref={toolbarRef}
//   //     style={{
//   //       position: 'absolute',
//   //       top: position.top,
//   //       left: position.left,
//   //       backgroundColor: '#fff',
//   //       border: '1px solid #ccc',
//   //       borderRadius: '8px',
//   //       padding: '8px 12px',
//   //       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//   //       zIndex: 9999,
//   //     }}
//   //   >
//   //     <span style={{ fontWeight: 'bold' }}>Opciones de formato</span>
//   //   </div>
//   // );
//   return (
//     <div
//       ref={toolbarRef}
//       style={{
//         position: 'absolute',
//         top: 100,
//         left: 100,
//         backgroundColor: '#fff',
//         border: '1px solid #ccc',
//         borderRadius: '8px',
//         padding: '8px 12px',
//         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//         zIndex: 9999,
//       }}
//     >
//       <span style={{ fontWeight: 'bold' }}>Barra de prueba</span>
//     </div>
//   );
  
// };

// export default FloatingFormatToolbar;


import React, { useState } from 'react';
import FloatingMenu from './FloatingMenu';

const FloatingFormatToolbar: React.FC = () => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Manejar el evento mouseup
  const handleMouseUp = (event: React.MouseEvent) => {
    console.log('handleMouseUp llamado'); // Debug: Verificar si la función se llama
    console.log('Posición del ratón:', { x: event.pageX, y: event.pageY }); // Debug: Coordenadas del ratón
    setMenuPosition({ x: event.pageX, y: event.pageY });
    setIsMenuVisible(true);
  };

  // Cerrar el menú
  const closeMenu = () => {
    console.log('closeMenu llamado'); // Debug: Verificar si la función se llama
    setIsMenuVisible(false);
  };

  return (
    <div onMouseUp={handleMouseUp} style={{ height: '100vh', cursor: 'pointer' }}>
      {/* Contenido principal */}
      <h1>Haz clic con el ratón para mostrar el menú flotante</h1>
      {/* Menú flotante */}
      <FloatingMenu position={menuPosition} isVisible={isMenuVisible} onClose={closeMenu} />
    </div>
  );
};

export default FloatingFormatToolbar;
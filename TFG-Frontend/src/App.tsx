import React, { useState } from 'react';
import Sidebar from './components/SideBar';  // Tu componente de login y registro
import MainPage from './pages/MainPage';    // Página principal a la que se redirige
import { AuthProvider } from '../context/AuthContext';  // Asumimos que tienes un contexto de autenticación
import FloatingFormatToolbar from './components/FloatingFormatToolbar'; // Toolbar que incluye el FloatingMenu

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Estado para la autenticación

  // Función para manejar el login
  const handleLogin = () => {
    // Aquí iría la lógica de autenticación
    setIsAuthenticated(true);  // Si el login es exitoso, cambias el estado
  };

  return (
    <AuthProvider>
      {isAuthenticated ? (  // Si el usuario está autenticado, renderiza MainPage
        <>
          <MainPage />
          {/* Incluimos el FloatingFormatToolbar como componente global */}
          <FloatingFormatToolbar />
        </>
      ) : (
        <Sidebar onLogin={handleLogin} />  // Si no, muestra el Sidebar (login/register)
      )}
    </AuthProvider>
  );
};

export default App;
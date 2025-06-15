import React, { useEffect, useState } from "react";
import Forum from "./Forum";
import axios from "../utils/axiosInstance";
import "../styles/main.css"; // Importar el archivo CSS

interface UserProfile {
  first_name: string;
  last_name: string;
  name: string;
  bio: string;
  interaccionesPublicas: InteraccionData[];
}

interface InteraccionData {
  id: number;
  url: string;
  foro_id: number;
  usuarios_visualizan: number[];
  usuarios_realizan: number[];
}

interface ExpecificProfileProps {
  userId: number; // Cambiado para aceptar userId
  onClose: () => void; // Función para volver a la pantalla anterior
}

const ExpecificProfile: React.FC<ExpecificProfileProps> = ({ userId, onClose }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [viewingForumId, setViewingForumId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`/user/profile/${userId}/`);
        const data = res.data as UserProfile;
  
        // Transformar el campo `interacciones_publicas` a `interaccionesPublicas`
        const transformedData = {
          ...data,
          interaccionesPublicas: (data as any).interacciones_publicas,
        };
  
        setUserProfile(transformedData);
      } catch (error) {
        console.error("Error al cargar el perfil del usuario:", error);
      }
    };
  
    fetchUserProfile();
  }, [userId]);

  // Si se está viendo un foro, mostrar la pantalla del foro
  if (viewingForumId !== null) {
    return (
      <Forum
        interactionId={viewingForumId}
        onBack={() => setViewingForumId(null)} // Volver al perfil del usuario
      />
    );
  }

  return (
  <div className='main-section'>
    <br />
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>

    <button onClick={onClose} className="back-button">
      Volver
    </button>
    </div>
    <br />
    {userProfile ? (
    <>
    <div className="search-section">
      <h2 className="profile-title">Perfil de {userProfile.name}</h2>
      <div className="interaction-item">
        <p className="inline-block-p">
          <strong>Nombre:</strong> {userProfile.first_name} {userProfile.last_name}
        </p>
        <p className="inline-block-p">
          <strong>Biografía:</strong> {userProfile.bio}
        </p>
        </div>  
    </div>
    <div className="search-section">
    <h3>Interacciones Públicas</h3>
    {userProfile.interaccionesPublicas && userProfile.interaccionesPublicas.length > 0 ? (
      <div >
        <div >
          {userProfile.interaccionesPublicas.map((interaccion) => (
            <div key={interaccion.id} className="interaction-item">
              <p className="inline-block-p">
                <strong>URL:</strong>{" "}
                <a href={interaccion.url} target="_blank" rel="noopener noreferrer">
                    {interaccion.url.length > 30
                    ? `${interaccion.url.substring(0, 30)}...`
                    : interaccion.url}
                </a>
              </p>
              <p className="inline-block-p">
                <strong>Usuarios que visualizan:</strong>{" "}
                {interaccion.usuarios_visualizan.length}
              </p>
              <p className="inline-block-p">
                <strong>Usuarios que realizan:</strong>{" "}
                {interaccion.usuarios_realizan.length}
              </p>
              <span style={{ display: "inline-block", width: "10px" }}></span>
              {interaccion.foro_id && (
                <button
                  onClick={() => setViewingForumId(interaccion.id)}
                  className="search-button"
                >
                  Ver Foro
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p>No hay interacciones públicas.</p>
    )}
    </div>
  </>
    ) : (
      <p>Cargando perfil...</p>
    )}
  </div>
);
}
export default ExpecificProfile;
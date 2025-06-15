import { useEffect, useState } from 'react'
import axios from '../utils/axiosInstance'
import InteractionPanel from './InteractionPanel';
import { setEntidadIdAndReload, openCollaborativeSocket } from '../content/content'; // Importamos la función para cambiar `entidadId`
import { entidadId } from '../content/content';
import Forum from "./Forum";
import Profile from "./Profile";
import "../styles/main.css"; // Importar el archivo CSS


interface infoFriends{
  id: number;
  name: string;
}

interface infoEntidad {
  id: number
  url: string
}

interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  name: string
  friends: infoFriends[]
}

interface FriendRequest {
  id: number
  from_user: number
  from_user_name: string
  timestamp: string
}

interface infoInterac {
  id: number
  privado: boolean
  numero_interacciones: number
  numero_usuarios_visualizan: number
  numero_usuarios_editan: number
  entidad: number
  owner: number
  owner_name: string
  usuarios_realizan:number[]
  usuarios_visualizan: number[]
}

export default function MainScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [interactions, setInteractions] = useState<infoInterac[]>([]);
  const [currentInteractionId, setCurrentInteractionId] = useState<number | null>(null);
  const [entidad, setEntidad] = useState<infoEntidad | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchI, setSearchI] = useState("");
  const [resultados, setResultados] = useState<infoInterac[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  let funcionColaborativa: boolean = false; // Variable para controlar si se ha abierto la función colaborativa
  


  useEffect(() => {
    fetchProfile();
    fetchRequests();
    initializeEntidadAndInteractions(); // Inicializar entidad e interacciones
  }, []);

  const initializeEntidadAndInteractions = async () => {
    const url = window.location.href;
    try {
      const entidadData = await getEntidad(url); // Obtener entidad
      //createInteraccion(entidadData.id);
      setEntidad(entidadData); // Actualizar estado de entidad
      fetchInteractions(entidadData.url); // Obtener interacciones usando la URL de la entidad
      setCurrentInteraccion(entidadData.url);
    } catch (error) {
      console.error('Error inicializando entidad e interacciones:', error);
    }
  };

  const getEntidad = async (url: string): Promise<infoEntidad> => {
    try {
      const response = await axios.get<infoEntidad>(`/interaction/entidad/${encodeURIComponent(url)}`);
      return response.data; // Devolver la entidad obtenida del servidor
    } catch (error) {
      console.error('Error al obtener la entidad:', error);
      throw error;
    }
  };

  const fetchInteractions = async (entidadUrl: string) => {
    try {
      console.log("Obteniendo interacciones para la URL:", entidadUrl);
      const response = await axios.get<infoInterac[]>(`/interaction/misInteracciones/${encodeURIComponent(entidadUrl)}`);
      console.log("se ha obtenido:", response.data);
      setInteractions(response.data);
    } catch (error) {
      console.error('Error al obtener las interacciones:', error);
    }
  };

  const setCurrentInteraccion = async (url: string) => {
    
    try {
      const response = await axios.get<infoInterac>(`/interaction/obtener/${url}`);
      setCurrentInteractionId(response.data.id);
      
    } catch (error) {
      console.error('No hay ninguna interaccion de este usuario en este elemento:', error);
      throw error;
    }
  };

  const handleVisualizar = async (interactionId: number, wr: boolean) => {
    console.log(`Cambiando a visualizar interacción: ${interactionId}`);
    await setEntidadIdAndReload(interactionId, wr); // Cambiar el `entidadId` y recargar modificaciones
    setCurrentInteractionId(interactionId); // Actualizar el estado actual
    await fetchInteractions(entidad?.url || ''); // Refrescar la lista
  };

  const manageSocket = (interaccionId: number) => {
    funcionColaborativa = !funcionColaborativa; // Alternar el estado de la función colaborativa
    openCollaborativeSocket(interaccionId); // Abrir o cerrar el socket colaborativo
  };

  const handleOpenInteractionPanel = () => {
    setShowInteractionPanel(true);
  };

  const handleCloseInteractionPanel = () => {
    setShowInteractionPanel(false);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };


  const fetchProfile = async () => {
    const res = await axios.get<UserProfile>('/user/profile/')
    setProfile(res.data)
  }

  const fetchRequests = async () => {
    const res = await axios.get<FriendRequest[]>('/user/friend-request/list/')
    console.log('Solicitudes recibidas:', res.data)
    setRequests(res.data || [])
  }


  const handleSearchI = async () => {
    setLoading(true);
    setError(null);
    setResultados(null);

    try {
      const response = await axios.get<infoInterac[]>(
        `/interaction/${encodeURIComponent(searchI)}/interacciones`
      );
      setResultados(response.data);
    } catch (err) {
      setError("No se pudieron obtener las interacciones. Verifica la URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnirse = async (interactionId: number) => {
    try {
      await axios.post("/interaction/unirse/", { interaccion: interactionId });
      alert("Te has unido como visualizador correctamente.");
      // Actualizar los resultados después de unirse
      handleSearchI();
    } catch (err) {
      alert("No se pudo completar la acción. Inténtalo de nuevo.");
    }
  };

  const [currentForumId, setCurrentForumId] = useState<number | null>(null);

  const handleOpenForum = (interactionId: number) => {
    setCurrentForumId(interactionId);
  };

  const handleCloseForum = () => {
    setCurrentForumId(null);
  };

  if (currentForumId) {
    // Mostrar el foro si se ha seleccionado una interacción
    return <Forum interactionId={currentForumId} onBack={handleCloseForum} />;
  }

  if (showProfile) {
    // Mostrar el perfil si se ha seleccionado
    return <Profile onClose={handleCloseProfile} />;
  }

  return (
    <>
<div className='main-section'>
  <br></br>
  {/* Mostrar el panel de interacciones o la pantalla principal */}
  {showInteractionPanel && profile ? (
    <InteractionPanel profile={profile} onClose={handleCloseInteractionPanel} />
  ) : (
    <>
      {/* Botón para abrir el perfil */}
      <div className="interaction-panel-button-container"
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <button onClick={handleOpenProfile} className="search-button">
              Perfil
            </button>
          </div>

      <br></br>
      <div className='search-section'>
        <h2 className="section-title">Interacciones en esta Web</h2>
        {interactions.length === 0 ? (
          <p className="inline-block-p">No tienes interacciones en esta página.</p>
        ) : (
          <div>
            {interactions.map((interaction) => (
              <div
              key={interaction.id}
              className="interaction-item"
              style={{
                backgroundColor: currentInteractionId === interaction.id ? "#E2F6FF" : "white",
              }}
            >
              <p className="inline-block-p">
                <strong>Entidad propiedad de:</strong> {interaction.owner_name}
              </p>
              <p className="inline-block-p">
                <strong>Rol:</strong>{" "}
                {interaction.usuarios_realizan.includes(profile.id) ? "Realizador" : "Visualizador"}
              </p>
              {currentInteractionId === interaction.id ? (
                <>
                  <span style={{ display: "inline-block", width: "10px" }}></span>
                  {interaction.usuarios_realizan.includes(profile.id) && (
                    <>
                      {funcionColaborativa ? (
                        <button onClick={() => manageSocket(interaction.id)} className="close-button">
                          Cerrar sesión
                        </button>
                      ) : (
                        <button onClick={() => manageSocket(interaction.id)} className="back-button">
                          Función colaborativa
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <span style={{ display: "inline-block", width: "10px" }}></span>
                  <button
                    onClick={() =>
                      handleVisualizar(interaction.id, interaction.usuarios_realizan.includes(profile.id))
                    }
                    className="search-button"
                  >
                    Visualizar
                  </button>
                </>
              )}
              <span style={{ display: "inline-block", width: "10px" }}></span>
              <button onClick={() => handleOpenForum(interaction.id)} className="search-button">
                Foro
              </button>
            </div>
            ))}
          </div>
        )}
      </div>


      <div className='search-section'>
        <h3 className="section-title">Buscar Interacciones</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Introduce la URL de la entidad..."
            value={searchI}
            onChange={(e) => setSearchI(e.target.value)}
            className="search-input"
          />
          <button
            onClick={handleSearchI}
            className="search-button"
          >
            Buscar
          </button>
        </div>

        <div>
          {loading && <p className="inline-block-p">Cargando...</p>}
          {error && <p className="inline-block-p">{error}</p>}
          {resultados && resultados.length > 0 && (
            <div>
              {resultados.map((interaccion) => (
                <div key={interaccion.id} className="interaction-item">
                  <p className="inline-block-p">
                    <strong>Usuario propietario:</strong>{" "}
                    {interaccion.owner_name}
                  </p>
                  <div>
                    {profile.id === interaccion.owner ? (
                      <p className="inline-block-p">
                        Eres el propietario de esta interacción.
                      </p>
                    ) : interaccion.usuarios_realizan.includes(profile.id) ? (
                      <p className="inline-block-p">
                        Estás participando en esta interacción.
                      </p>
                    ) : interaccion.usuarios_visualizan.includes(profile.id) ? (
                      <p className="inline-block-p">
                        Puedes visualizar esta interacción.
                      </p>
                    ) : interaccion.privado ? (
                      <p className="inline-block-p">
                        No tienes acceso a esta interacción (Privado).
                      </p>
                    ) : (
                      <>
                        <span style={{ display: "inline-block", width: "10px" }}></span>
                        <button
                          onClick={() => handleUnirse(interaccion.id)}
                          className="search-button "
                        >
                          Unirse
                        </button>
                      </>
                    )}
                    <span style={{ display: "inline-block", width: "10px" }}></span>
                    <button
                      onClick={() => handleOpenForum(interaccion.id)}
                      className="search-button"
                    >
                      Foro
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {resultados && resultados.length === 0 && (
            <p className="inline-block-p">No se encontraron interacciones.</p>
          )}
        </div>
      </div>

      
      {/* Botón para abrir el panel de interacciones */}
      <div className="interaction-panel-button-container"
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <button
          onClick={handleOpenInteractionPanel}
          className="search-button"
        >
          Ver Panel de Interacciones
        </button>
      </div>
        </>
      )}


    </div>   
    </>   
  )
}

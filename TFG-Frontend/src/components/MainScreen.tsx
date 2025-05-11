import { useEffect, useState } from 'react'
import axios from '../utils/axiosInstance'
import InteractionPanel from './InteractionPanel';
import { setEntidadIdAndReload, openCollaborativeSocket } from '../content/content'; // Importamos la función para cambiar `entidadId`
import { entidadId } from '../content/content';
import Forum from "./Forum";
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
  usuarios_realizan:number[]
  usuarios_visualizan: number[]
}

export default function MainScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<'email' | 'name' | 'first_name' | 'last_name'>('name')
  const [results, setResults] = useState<UserProfile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [interactions, setInteractions] = useState<infoInterac[]>([]);
  const [currentInteractionId, setCurrentInteractionId] = useState<number | null>(null);
  const [entidad, setEntidad] = useState<infoEntidad | null>(null);

  const [searchI, setSearchI] = useState("");
  const [resultados, setResultados] = useState<infoInterac[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  


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

  // const createInteraccion = async (entidadId: number): Promise<number | null> => {
  //   if (currentInteractionId) return currentInteractionId;

  //   try {
  //     const response = await axios.post<infoInterac>('/interaction/crear/', {
  //       entidad: entidadId,
  //     });
  //     setCurrentInteractionId(response.data.id);
  //     return response.data.id;
  //   } catch (error) {
  //     console.error('Error al crear la interacción:', error);
  //     throw error;
  //   }
  // };

  const handleVisualizar = async (interactionId: number) => {
    console.log(`Cambiando a visualizar interacción: ${interactionId}`);
    await setEntidadIdAndReload(interactionId); // Cambiar el `entidadId` y recargar modificaciones
    setCurrentInteractionId(interactionId); // Actualizar el estado actual
    await fetchInteractions(entidad?.url || ''); // Refrescar la lista
  };


  const handleOpenInteractionPanel = () => {
    setShowInteractionPanel(true);
  };

  const handleCloseInteractionPanel = () => {
    setShowInteractionPanel(false);
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

  const handleSearch = async () => {
    if (!search.trim()) return
    try {
      const res = await axios.get<UserProfile[]>(`/user/profile/search/?${searchField}=${search}`)
      setResults(res.data)
    } catch (error) {
      console.error('Error en la búsqueda:', error)
    }
  } 
  

  const sendRequest = async (toId: number) => {
    await axios.post('/user/friend-request/send/', { to_user: toId })
    alert('Solicitud enviada')
  }

  const acceptRequest = async (fromId: number) => {
    await axios.post('/user/friend-request/accept/', { from_user_id: fromId })
    fetchRequests()
  }

  const rejectRequest = async (fromId: number) => {
    await axios.post('/user/friend-request/delete/', { from_user_id: fromId })
    fetchRequests()
  }

  const handleSearchI = async () => {
    setLoading(true);
    setError(null);
    setResultados(null);

    try {
      const response = await axios.get<infoInterac[]>(
        `/interaction/entidad/${encodeURIComponent(searchI)}/interacciones`
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

  return (
<div className="main-screen-container">
  {/* Mostrar el panel de interacciones o la pantalla principal */}
  {showInteractionPanel && profile ? (
    <InteractionPanel profile={profile} onClose={handleCloseInteractionPanel} />
  ) : (
    <>
      {/* Perfil del usuario */}
      {profile && (
        <div className="profile-section">
          <h2 className="section-title">👤 Tu Perfil</h2>
          <p>
            <strong>Nombre:</strong> {profile.first_name} {profile.last_name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Amigos:</strong>{" "}
            {profile.friends.length > 0
              ? profile.friends.map((friend) => friend.name).join(", ")
              : "Ninguno"}
          </p>
        </div>
      )}

      {/* Buscador de usuarios */}
      <div className="search-section">
        <h3 className="section-title">🔍 Buscar usuarios</h3>
        <div className="search-bar">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="search-select"
          >
            <option value="name">Nombre de usuario</option>
            <option value="first_name">Nombre</option>
            <option value="last_name">Apellido</option>
            <option value="email">Email</option>
          </select>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            {results.map((user) => (
              <div key={user.id} className="result-item">
                <p>
                  {user.first_name} {user.last_name} ({user.email})
                </p>
                <button
                  onClick={() => sendRequest(user.id)}
                  className="result-button"
                >
                  Enviar solicitud
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes recibidas */}
      <div className="requests-section">
        <h3 className="section-title">📨 Solicitudes recibidas</h3>
        {requests.length === 0 ? (
          <p className="empty-message">No tienes solicitudes pendientes</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="request-item">
              <p>
                De: <strong>{req.from_user_name}</strong>
              </p>
              <div className="request-actions">
                <button
                  onClick={() => acceptRequest(req.from_user)}
                  className="accept-button"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => rejectRequest(req.from_user)}
                  className="reject-button"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="interactions-section">
        <h2 className="section-title">🌐 Interacciones en esta URL</h2>
        {interactions.length === 0 ? (
          <p className="empty-message">No tienes interacciones en esta página.</p>
        ) : (
          <div className="interaction-list">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="interaction-item">
                <p>
                  <strong>Entidad propiedad de:</strong> {interaction.owner}
                </p>
                {currentInteractionId === interaction.id ? (
                  <>
                  <span className="active-status">Visualizando</span>
                  <button
                    onClick={() => openCollaborativeSocket(interaction.id)}
                    className="collaboration-button"
                  >
                    Función colaborativa
                  </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleVisualizar(interaction.id)}
                    className="view-button"
                  >
                    Visualizar
                  </button>
                )}
                <button
                  onClick={() => handleOpenForum(interaction.id)}
                  className="forum-button"
                >
                  Foro
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="search-interactions-section">
        <h3 className="section-title">🔍 Buscar Interacciones</h3>
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
          {loading && <p className="loading-message">Cargando...</p>}
          {error && <p className="error-message">{error}</p>}
          {resultados && resultados.length > 0 && (
            <div className="search-results">
              {resultados.map((interaccion) => (
                <div key={interaccion.id} className="result-item">
                  <h4>Interacción #{interaccion.id}</h4>
                  <p>
                    <strong>Privado:</strong> {interaccion.privado ? "Sí" : "No"}
                  </p>
                  <p>
                    <strong>Número de interacciones:</strong>{" "}
                    {interaccion.numero_interacciones}
                  </p>
                  <p>
                    <strong>Usuarios que pueden visualizar:</strong>{" "}
                    {interaccion.usuarios_visualizan.length}
                  </p>
                  <p>
                    <strong>Usuarios que pueden editar:</strong>{" "}
                    {interaccion.numero_usuarios_editan}
                  </p>
                  {profile.id === interaccion.owner ? (
                    <p className="text-green-600 font-medium">
                      Eres el propietario de esta interacción.
                    </p>
                  ) : interaccion.usuarios_realizan.includes(profile.id) ? (
                    <p className="text-green-600 font-medium">
                      Estás participando en esta interacción.
                    </p>
                  ) : interaccion.usuarios_visualizan.includes(profile.id) ? (
                    <p className="text-green-600 font-medium">
                      Puedes visualizar esta interacción.
                    </p>
                  ) : interaccion.privado ? (
                    <p className="text-red-600 font-medium">
                      No tienes acceso a esta interacción (Privado).
                    </p>
                  ) : (
                    <button
                      onClick={() => handleUnirse(interaccion.id)}
                      className="join-button"
                    >
                      Unirme como Visualizador
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenForum(interaccion.id)}
                    className="forum-button"
                  >
                    Foro
                  </button>
                </div>
              ))}
            </div>
          )}
          {resultados && resultados.length === 0 && (
            <p className="empty-message">No se encontraron interacciones.</p>
          )}
        </div>
      </div>

      
      {/* Botón para abrir el panel de interacciones */}
      <div className="interaction-panel-button-container">
        <button
          onClick={handleOpenInteractionPanel}
          className="interaction-panel-button"
        >
          Ver Panel de Interacciones
        </button>
      </div>
        </>
      )}


    </div>      
  )
}

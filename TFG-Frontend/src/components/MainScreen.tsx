import { useEffect, useState } from 'react'
import axios from '../utils/axiosInstance'
import InteractionPanel from './InteractionPanel';
import { setEntidadIdAndReload } from '../content/content'; // Importamos la función para cambiar `entidadId`
import { entidadId } from '../content/content';


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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
       {/* Mostrar el panel de interacciones o la pantalla principal */}
       {showInteractionPanel && profile ? (
        <InteractionPanel profile={profile} onClose={handleCloseInteractionPanel} /> // Pasar profile y onClose como props
      ) : (
        <>
      {/* Perfil */}
      {profile && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">👤 Tu Perfil</h2>
          <p><strong>Nombre:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Amigos:</strong> {profile.friends.length > 0 ? profile.friends.map(friend => friend.name).join(', ') : 'Ninguno'}</p>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">🔍 Buscar usuarios</h3>
        <div className="flex gap-2">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="border px-3 py-2 rounded-lg"
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
            className="flex-grow border px-3 py-2 rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(user => (
              <div key={user.id} className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
                <p>{user.first_name} {user.last_name} ({user.email})</p>
                <button
                  onClick={() => sendRequest(user.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                >
                  Enviar solicitud
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes recibidas */}
      <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold">📨 Solicitudes recibidas</h3>
        {requests.length === 0 ? (
          <p className="text-gray-600">No tienes solicitudes pendientes</p>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
              <p>De: <strong>{req.from_user_name}</strong></p>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(req.from_user)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => rejectRequest(req.from_user)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        <h2 className="text-xl font-semibold">🌐 Interacciones en esta URL</h2>

        {interactions.length === 0 ? (
          <p className="text-gray-600">No tienes interacciones en esta página.</p>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center"
              >
                <p>
                  <strong>Entidad propiedad de:</strong> {interaction.owner}
                </p>
                {currentInteractionId === interaction.id ? (
                  <span className="text-green-600 font-semibold">Visualizando</span>
                ) : (
                  <button
                    onClick={() => handleVisualizar(interaction.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                  >
                    Visualizar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Botón para abrir el panel de interacciones */}
      <div className="text-center">
            <button
              onClick={handleOpenInteractionPanel} // Llamar a la función para abrir el panel
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Ver Panel de Interacciones
            </button>
          </div>
        </>
      )}

    </div>


      
  )
}

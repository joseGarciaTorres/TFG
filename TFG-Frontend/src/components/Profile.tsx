import { useEffect, useState } from 'react'
import axios from '../utils/axiosInstance'
import ExpecificProfile from "./ExpecificProfile"; // Importar el componente
import "../styles/main.css"; // Importar el archivo CSS


interface infoFriends{
    id: number;
    name: string;
  }


  interface FriendRequest {
    id: number
    from_user: number
    from_user_name: string
    timestamp: string
  }

interface UserProfile {
    id: number
    email: string
    first_name: string
    last_name: string
    name: string
    friends: infoFriends[]
    bio: string
  }

interface ProfileProps {
    onClose: () => void; // Prop para volver a MainScreen
  }

export default function Profile({ onClose }: ProfileProps) {
    const [searchField, setSearchField] = useState("name");
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [first_name, setFirst_name] = useState("");
    const [last_name, setLast_name] = useState("");
    const [bio, setBio] = useState("");
    const [viewingUserId, setViewingUserId] = useState<number | null>(null); // Estado para el ID del usuario que se está viendo


  const handleSave = async () => {
    profile.first_name = first_name;
    profile.last_name = last_name;
    profile.bio = bio;
    await axios.put('/user/profile/', {
      first_name: first_name,
      last_name: last_name,
      bio: bio,
    });
    setIsEditing(false); // Salir del modo de edición
  };


  useEffect(() => {
    // Cargar el perfil y las solicitudes solo una vez al montar el componente
    fetchProfile();
    fetchRequests();
  }, []); // Dependencia vacía para que se ejecute solo una vez
  
  useEffect(() => {
    // Actualizar los estados locales cuando el perfil cambie
    if (profile) {
      setFirst_name(profile.first_name);
      setLast_name(profile.last_name);
      setBio(profile.bio);
    }
  }, [profile]);


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

  const handleViewProfile = (friendId: number) => {
    setViewingUserId(friendId); // Establecer el ID del usuario cuyo perfil se va a ver
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await axios.put("/user/profile/", {
        friends_to_remove: [friendId],
      });
      console.log(`Amigo con ID ${friendId} eliminado`);
      // Actualizar la lista de amigos en el estado local
      setProfile((prevProfile) => {
        if (!prevProfile) return null; // Ensure prevProfile is not null
        return {
          ...prevProfile,
          friends: prevProfile.friends.filter((friend) => friend.id !== friendId),
        };
      });
    } catch (error) {
      console.error("Error al eliminar al amigo:", error);
      alert("Hubo un error al eliminar al amigo. Por favor, inténtalo de nuevo.");
    }
  };

  if (viewingUserId !== null) {
    // Si se está viendo el perfil de otro usuario, mostrar ExpecificProfile
    return (
      <ExpecificProfile
        userId={viewingUserId}
        onClose={() => setViewingUserId(null)} // Volver a la pantalla de Profile
      />
    );
  }

  return (
<div className='main-section'>
      <br />
      <div className="interaction-panel-header">
        <button onClick={onClose} className="back-button">
          Menu 
        </button>
      </div>

      <h2 className="interaction-panel-title">Perfil</h2>

      <div className='search-section'>
      {/* Perfil del usuario */}
      {profile ? (
        !isEditing ? (
          <>
            <div className="interaction-item">
            <p className="inline-block-p">
              <strong>Nombre:</strong> {profile.first_name} {profile.last_name}
            </p>
            <p className="inline-block-p">
              <strong>Email:</strong> {profile.email}
            </p>
            <p className="inline-block-p">
              <strong>Biografia:</strong> {profile.bio}
            </p>
            </div>
            <div className="interaction-item">
            <p className="inline-block-p">
              <strong>Amigos:</strong>
              {profile.friends.length > 0 ? (
                profile.friends.map((friend) => (
                  <div key={friend.id} style={{ marginBottom: "10px" }}>
                    <span className="inline-block-p">{friend.name}</span>
                    <button
                      onClick={() => handleViewProfile(friend.id)}
                      className="search-button"
                      style={{ marginLeft: "10px" }}
                    >
                      Ver perfil
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="search-button"
                      style={{ marginLeft: "10px" }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              ) : (
                "Ninguno"
              )}
            </p>
            </div>
            <button onClick={() => setIsEditing(true)} className="search-button">
              Editar
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label>
                <strong>Nombre:</strong>
                <input
                  type="text"
                  name="first_name"
                  value={first_name}
                  onChange={(e) => setFirst_name(e.target.value)}
                  className="search-input"
                />
              </label>
              <label>
                <strong>Apellido:</strong>
                <input
                  type="text"
                  name="last_name"
                  value={last_name}
                  onChange={(e) => setLast_name(e.target.value)}
                  className="search-input"
                />
              </label>
              <label>
                <strong>Biografia:</strong>
                <input
                  type="text"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="search-input"
                />
              </label>
            </div>
            <div style={{ marginBottom: "10px" }}>
            <button onClick={handleSave} className="search-button">
              Guardar
            </button>
            <span style={{ display: "inline-block", width: "10px" }}></span>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              Cancelar
            </button>
            </div>
          </>
        )
      ) : (
        <p>Cargando perfil...</p>
      )}
      </div>

      {/* Buscador de usuarios */}
      <div className="search-section">
        <h3 className="section-title">Buscar usuarios</h3>
        <div className="search-bar" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
      <div className="search-section">
        <h3 className="section-title">Solicitudes recibidas</h3>
        {requests.length === 0 ? (
          <p className="empty-message">No tienes solicitudes pendientes</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} style={{ marginBottom: "10px" }}>
              <p>
                De: <strong>{req.from_user_name}</strong>
              </p>
              <div className="request-actions">
                <button
                  onClick={() => acceptRequest(req.from_user)}
                  className="search-button"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => rejectRequest(req.from_user)}
                  className="search-button"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))
        )}
      </div>


    </div>      
  )
}

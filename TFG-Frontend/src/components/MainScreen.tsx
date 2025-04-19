import { useEffect, useState } from 'react'
import axios from '../utils/axiosInstance'

interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  name: string
  friends: number[]
}

interface FriendRequest {
  id: number
  from_user: number
  from_user_name: string
  timestamp: string
}

export default function MainScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<'email' | 'name' | 'first_name' | 'last_name'>('name')
  const [results, setResults] = useState<UserProfile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])

  useEffect(() => {
    fetchProfile()
    fetchRequests()
  }, [])

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
      {/* Perfil */}
      {profile && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">👤 Tu Perfil</h2>
          <p><strong>Nombre:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Amigos:</strong> {profile.friends.length > 0 ? profile.friends.join(', ') : 'Ninguno'}</p>
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
    </div>
  )
}

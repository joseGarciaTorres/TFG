import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import InteractionAdmin from "./InteractionAdmin";


interface Interaccion {
  id: number;
  entidad: string;
  owner: number;
  privado: boolean;
  numero_interacciones: number;
  numero_usuarios_visualizan: number;
  numero_usuarios_editan: number;
  usuarios_realizan: number[];
  usuarios_visualizan: number[];
}

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  friends: infoFriends[];
}

interface infoFriends {
  id: number;
  name: string;
}

interface InteractionPanelProps {
  profile: UserProfile; // Perfil del usuario
  onClose: () => void; // Prop para cerrar el panel
}

export default function InteractionPanel({ profile, onClose }: InteractionPanelProps) {
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"owner" | "realizador" | "visualizador" | "all">(
    "all"
  );
  const [adminInteractionId, setAdminInteractionId] = useState<number | null>(null);

  const openAdminPanel = (interactionId: number) => {
    setAdminInteractionId(interactionId); // Abre el panel de administración
  };

  const closeAdminPanel = () => {
    setAdminInteractionId(null); // Cierra el panel de administración
  };

  useEffect(() => {
    fetchInteracciones();
  }, []);

  const fetchInteracciones = async () => {
    try {
      const res = await axios.get<Interaccion[]>("/interaction/misInteracciones/");
      setInteracciones(res.data);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
    }
  };


  const filteredInteracciones = interacciones.filter((interaccion) => {
    if (filter === "owner") {
      return interaccion.owner === profile.id;
    } else if (filter === "realizador") {
      return interaccion.usuarios_realizan.includes(profile.id);
    } else if (filter === "visualizador") {
      return interaccion.usuarios_visualizan.includes(profile.id);
    }
    return true;
  });

  const searchedInteracciones = filteredInteracciones.filter((interaccion) =>
    interaccion.entidad.toLowerCase().includes(search.toLowerCase())
  );

  if (adminInteractionId !== null) {
    return (
      <InteractionAdmin
        profile={profile}
        interactionId={adminInteractionId}
        onClose={closeAdminPanel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {/* Botón para volver a MainScreen */}
      <div className="text-center">
        <button
          onClick={onClose} // Llamar a la función para volver a MainScreen
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mb-4"
        >
          Volver a MainScreen
        </button>
      </div>
      
      <h2 className="text-xl font-semibold">🧩 Panel de Interacciones</h2>

      {/* Buscador */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por entidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow border px-3 py-2 rounded-lg"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="all">Todos</option>
          <option value="owner">Propietario</option>
          <option value="realizador">Realizador</option>
          <option value="visualizador">Visualizador</option>
        </select>
      </div>

      {/* Listado de Interacciones */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {searchedInteracciones.length === 0 ? (
          <p className="text-gray-600">No se encontraron interacciones.</p>
        ) : (
          searchedInteracciones.map((interaccion) => (
            <div key={interaccion.id} className="bg-gray-100 p-4 rounded-lg">
              <p>
                <strong>Entidad:</strong>{" "}
                {interaccion.entidad.length > 30
                  ? `${interaccion.entidad.slice(0, 30)}...`
                  : interaccion.entidad}
              </p>
              <p>
                <strong>Total Usuarios:</strong>{" "}
                {interaccion.numero_usuarios_visualizan + interaccion.numero_usuarios_editan}
              </p>
              <p>
                <strong>Rol:</strong>{" "}
                {interaccion.owner === profile.id
                  ? "Propietario"
                  : interaccion.usuarios_realizan.includes(profile.id)
                  ? "Realizador"
                  : "Visualizador"}
              </p>

              {interaccion.owner === profile.id ? (
                <button
                    onClick={() => openAdminPanel(interaccion.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                >
                    Administrar
                </button>
              ) : (
                <button
                  onClick={() => alert("Anular suscripción.")}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                >
                  Anular suscripción
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
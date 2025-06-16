import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import InteractionAdmin from "./InteractionAdmin";
import "../styles/interaction-panel.css"; // Importar el archivo CSS
import "../styles/main.css"; // Importar estilos globales


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
  const [adminUrl, setAdminUrl] = useState<string | null>("");

  const openAdminPanel = (interactionId: number, url: string) => {
    setAdminInteractionId(interactionId); // Abre el panel de administración
    setAdminUrl(url);
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

  const anularSuscripcion = async (interactionId: number) => {
    try {
      await axios.delete(`${interactionId}/anulaSuscripcion`);
      alert("Te has desuscrito correctamente.");
      // Aquí puedes agregar lógica adicional, como actualizar el estado o recargar las interacciones
      fetchInteracciones(); // Vuelve a cargar las interacciones después de desuscribirse
    } catch (error) {
      console.error("Error al desuscribirse:", error);
      alert("Hubo un error al intentar desuscribirte. Por favor, inténtalo de nuevo.");
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
        url = {adminUrl || ""}
        onClose={closeAdminPanel}
      />
    );
  }

return (
  <div className='main-section'>
    {/* Botón para volver a MainScreen */}
    <br />
      <div className="interaction-panel-header">
        <button onClick={onClose} className="back-button">
          Menu
        </button>
      </div>
    
      <h2 className="interaction-panel-title">Panel de Interacciones</h2>

    <div className='search-section'>
    {/* Buscador */}
    <div className="interaction-panel-search">
      <input
        type="text"
        placeholder="Buscar por entidad..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="interaction-panel-input"
      />
    </div>

    <div className="interaction-panel-search">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as any)}
        className="interaction-panel-select"
      >
        <option value="all">Todos</option>
        <option value="owner">Propietario</option>
        <option value="realizador">Realizador</option>
        <option value="visualizador">Visualizador</option>
      </select>
    </div>

    {/* Listado de Interacciones */}
      {searchedInteracciones.length === 0 ? (
        <p className="interaction-panel-empty">No se encontraron interacciones.</p>
      ) : (
        searchedInteracciones.map((interaccion) => (
          <div key={interaccion.id} className="interaction-item">
            <p className="inline-block-p">
              <strong>Pagina web:</strong>{" "}
              {interaccion.entidad.length > 30
                ? `${interaccion.entidad.slice(0, 30)}...`
                : interaccion.entidad}
            </p>
            <p className="inline-block-p">
            <strong>Total Usuarios:</strong>{" "}
            {interaccion.usuarios_realizan.length + interaccion.usuarios_visualizan.length}
            </p>
            <p className="inline-block-p">
              <strong>Rol:</strong>{" "}
              {interaccion.owner === profile.id
                ? "Propietario"
                : interaccion.usuarios_realizan.includes(profile.id)
                ? "Realizador"
                : "Visualizador"}
            </p>

            {interaccion.owner === profile.id ? (
              <>
                <span style={{ display: "inline-block", width: "10px" }}></span>
                <button
                  onClick={() => openAdminPanel(interaccion.id, interaccion.entidad)}
                  className="search-button"
                >
                  Administrar
                </button>
              </>
            ) : (
              <>
                <span style={{ display: "inline-block", width: "10px" }}></span>
                <button
                  onClick={() => anularSuscripcion(interaccion.id)}
                  className="cancel-button"
                >
                  Anular suscripción
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  </div>
);
}
import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import "../styles/interaction-admin-panel.css"; // Importar el archivo CSS

interface Interaccion {
  id: number;
  entidad: string;
  owner: number;
  privado: boolean;
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

interface InteractionAdminProps {
  profile: UserProfile;
  interactionId: number;
  onClose: () => void;
}

export default function InteractionAdmin({
  profile,
  interactionId,
  onClose,
}: InteractionAdminProps) {
  const [interaction, setInteraction] = useState<Interaccion | null>(null);
  const [role, setRole] = useState<"editar" | "visualizar">("visualizar"); // Estado para alternar entre roles

  useEffect(() => {
    fetchInteraction();
  }, [interactionId]);

  const fetchInteraction = async () => {
    try {
      const res = await axios.get<Interaccion>(`/interaction/${interactionId}`);
      setInteraction(res.data);
    } catch (error) {
      console.error("Error al obtener la interacción:", error);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      await axios.post(`/interaction/${interactionId}/eliminar-usuarios/`, { usuarios: [userId] });
      alert("Usuario eliminado de la interacción.");
      fetchInteraction();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  const handleShare = async (userId: number, role: "editar" | "visualizar") => {
    try {
      await axios.post("/interaction/compartir/", {
        interaccion: interactionId,
        compartido_con: userId,
        permiso: role,
      });
      alert("Interacción compartida exitosamente.");
      fetchInteraction();
    } catch (error) {
      console.error("Error al compartir la interacción:", error);
    }
  };

  const handleDeleteInteraction = async () => {
    try {
      await axios.delete(`/interaction/${interactionId}`);
      alert("Interacción eliminada exitosamente.");
      onClose();
    } catch (error) {
      console.error("Error al eliminar la interacción:", error);
    }
  };

  // Obtiene el nombre del usuario dado su ID
  const getUserName = (userId: number): string => {
    if (userId === profile.id) return profile.name;
    const friend = profile.friends.find((f) => f.id === userId);
    return friend ? friend.name : `Usuario ${userId}`;
  };

  if (!interaction) return <p>Cargando interacción...</p>;

return (
  <div className="interaction-admin-container">
    {/* Título */}
    <h2 className="interaction-admin-title">⚙️ Administrar Interacción</h2>

    {/* Detalles de la interacción */}
    <div className="interaction-admin-details">
      <p>
        <strong>Entidad:</strong> {interaction.id}
      </p>
      <p>
        <strong>Total Usuarios:</strong>{" "}
        {interaction.usuarios_visualizan.length + interaction.usuarios_realizan.length}
      </p>
    </div>

    {/* Lista de usuarios */}
    <div className="interaction-admin-users">
      <h3 className="interaction-admin-subtitle">Usuarios Suscritos:</h3>
      {interaction.usuarios_visualizan.concat(interaction.usuarios_realizan).map((userId) => (
        <div key={userId} className="interaction-admin-user-item">
          <p>{getUserName(userId)}</p>
          {userId !== interaction.owner && (
            <button
              onClick={() => handleRemoveUser(userId)}
              className="interaction-admin-remove-button"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>

    {/* Compartir interacción */}
    <div className="interaction-admin-share">
      <h3 className="interaction-admin-subtitle">Compartir Interacción:</h3>
      {profile.friends.map((friend) => {
        const isShared =
          interaction.usuarios_realizan.includes(friend.id) ||
          interaction.usuarios_visualizan.includes(friend.id);

        return (
          <div key={friend.id} className="interaction-admin-share-item">
            <p>{friend.name}</p>
            {!isShared && (
              <div className="interaction-admin-share-actions">
                {/* Toggle para seleccionar rol */}
                <div className="interaction-admin-role-toggle">
                  <label className="interaction-admin-role-label">Rol:</label>
                  <button
                    onClick={() =>
                      setRole((prevRole) =>
                        prevRole === "visualizar" ? "editar" : "visualizar"
                      )
                    }
                    className={`interaction-admin-role-button ${
                      role === "visualizar"
                        ? "interaction-admin-role-visualizar"
                        : "interaction-admin-role-editar"
                    }`}
                  >
                    {role === "visualizar" ? "Visualizar" : "Editar"}
                  </button>
                </div>

                {/* Botón de compartir */}
                <button
                  onClick={() => handleShare(friend.id, role)}
                  className="interaction-admin-share-button"
                >
                  Compartir
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Eliminar interacción */}
    <button
      onClick={handleDeleteInteraction}
      className="interaction-admin-delete-button"
    >
      Eliminar Interacción
    </button>

    {/* Volver */}
    <button
      onClick={onClose}
      className="interaction-admin-back-button"
    >
      Volver
    </button>
  </div>
);
}
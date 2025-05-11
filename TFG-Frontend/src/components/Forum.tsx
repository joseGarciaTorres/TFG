import React, { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import "../styles/forum.css"; // Importar el archivo CSS

interface Comment {
  id: number;
  foro: number;
  usuario: string;
  contenido: string;
  fecha: string;
  comentario_padre: number | null;
}

interface paginationComment {
  count: number;
  next: number | null;
  previous: number | null;
  results: Comment[];
}

interface ForumProps {
  interactionId: number;
  onBack: () => void; // Para volver al MainScreen
}

const Forum: React.FC<ForumProps> = ({ interactionId, onBack }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null); // Estado para manejar respuestas
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<paginationComment>(
          `/foro/${interactionId}/comentarios/`
        );
        setComments(response.data.results); // Assuming paginated results
      } catch (err) {
        setError("No se pudieron obtener los comentarios.");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [interactionId]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post<Comment>(
        `/foro/${interactionId}/comentarios/`,
        {
          contenido: newComment,
          comentario_padre: replyTo, // Enviar el comentario padre, si existe
        }
      );
      setComments((prev) => [...prev, response.data]); // Añadir nuevo comentario al estado
      setNewComment(""); // Limpiar el campo de texto
      setReplyTo(null); // Resetear el estado de respuesta
    } catch (err) {
      alert("No se pudo publicar el comentario. Inténtalo de nuevo.");
    }
  };

  // Renderizar comentarios recursivamente
  const renderComments = (parentId: number | null, depth = 0) => {
    return comments
      .filter((comment) => comment.comentario_padre === parentId)
      .map((comment) => (
        <div
          key={comment.id}
          className={`comment-item`}
          style={{ marginLeft: depth * 20 }} // Desplazar según la profundidad
        >
          <p className="comment-user">
            <strong>{comment.usuario}</strong>: {comment.contenido}
          </p>
          <p className="comment-date">
            {new Date(comment.fecha).toLocaleString()}
          </p>
          {comment.comentario_padre === null && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="comment-reply-button"
            >
              Responder
            </button>
          )}
          {/* Renderizar respuestas */}
          {renderComments(comment.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="forum-container">
      <button onClick={onBack} className="forum-back-button">
        ⬅️ Volver
      </button>
      <h2 className="forum-title">💬 Foro de la Interacción #{interactionId}</h2>

      {loading ? (
        <p className="forum-loading">Cargando comentarios...</p>
      ) : error ? (
        <p className="forum-error">{error}</p>
      ) : (
        <div className="forum-comments-container">
          {comments.length > 0 ? (
            renderComments(null) // Renderizar los comentarios de nivel superior
          ) : (
            <p className="forum-no-comments">No hay comentarios en este foro.</p>
          )}
        </div>
      )}

      {/* Campo para publicar un nuevo comentario */}
      <div className="forum-new-comment">
        {replyTo && (
          <div className="forum-reply-notification">
            <p>
              Respondiendo a comentario #{replyTo}{" "}
              <button
                onClick={() => setReplyTo(null)}
                className="forum-reply-cancel"
              >
                Cancelar
              </button>
            </p>
          </div>
        )}
        <textarea
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="forum-textarea"
        />
        <button onClick={handlePostComment} className="forum-submit-button">
          Publicar
        </button>
      </div>
    </div>
  );
};

export default Forum;
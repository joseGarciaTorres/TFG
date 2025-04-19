import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        await login(email, password)
        onLogin()
      } catch (err) {
        alert('Error al iniciar sesión')
      } finally {
        setLoading(false)
      }
    }
  
    return (
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Iniciar sesión</h2>
        <input
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Iniciar sesión'}
        </button>
      </form>
    )
  }
  

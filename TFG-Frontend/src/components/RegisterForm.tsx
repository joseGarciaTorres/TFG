import React, { useState } from 'react'
import axios from '../utils/axiosInstance'

export default function RegisterForm() {
    const [formData, setFormData] = useState({
      email: '',
      name: '',
      password: '',
      password2: '',
      tc: true
    })
    const [loading, setLoading] = useState(false)
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        await axios.post('/user/register/', formData)
        alert('Registro exitoso. Ahora puedes iniciar sesión.')
      } catch (err) {
        alert('Error al registrarse')
      } finally {
        setLoading(false)
      }
    }
  
    return (
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Crear cuenta</h2>
        <input name="email" placeholder="Correo electrónico" onChange={handleChange} required type="email" />
        <input name="name" placeholder="Nombre completo" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
        <input name="password2" type="password" placeholder="Repite la contraseña" onChange={handleChange} required />
        <label>
          <input type="checkbox" name="tc" checked={formData.tc} onChange={handleChange} required /> Acepto los términos
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    )
  }
  
import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import MainScreen from '../components/MainScreen'
import { AuthProvider, useAuth } from '../context/AuthContext'
import '../styles/sidebar.css'
import '../styles/auth-form.css'

interface SidebarProps {
  onLogin: () => void;
  isLoggedIn: boolean;
}

const SidebarContent = ({ onLogin, isLoggedIn }: SidebarProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const { isAuthenticated, logout } = useAuth()

  if (isAuthenticated || isLoggedIn) {
    return (
      <div className="sidebar">
        <button onClick={logout} className="shadow-effect">Cerrar sesión</button>
        <MainScreen />
      </div>
    )
  }

  return (
    <div className="sidebar">
      {isLogin ? <LoginForm onLogin={onLogin} /> : <RegisterForm />}
      <button onClick={() => setIsLogin(!isLogin)} className="shadow-effect">
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}

export default function Sidebar(props: SidebarProps) {
  return (
    <AuthProvider>
      <SidebarContent {...props} />
    </AuthProvider>
  )
}
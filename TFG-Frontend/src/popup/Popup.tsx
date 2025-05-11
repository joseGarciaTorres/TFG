import ReactDOM from 'react-dom/client'

const App = () => {
  return <h1>Hola desde la extensión!</h1>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)

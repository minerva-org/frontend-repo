import { AuthProvider } from './context/AuthContext'; 
import Login from './pages/Login';
import Grupos from './pages/CatalogoGrupos';

export default function App() { 
  return ( <AuthProvider> <Grupos /> </AuthProvider> );
}
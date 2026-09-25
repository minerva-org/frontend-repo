import { AuthProvider } from './context/AuthContext'; 
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Grupos from './pages/Grupos';
import Alumnos from './pages/Alumno';
import ProtectedRoute from './components/ProtectedRoute.tsx';

export default function App() { 
  return ( <AuthProvider> 
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/grupos" element={
          <ProtectedRoute allowedRoles={['docente', 'coordinador', 'directorPlanta', 'directorGeneral']}>
            <Grupos />
          </ProtectedRoute>
        } />

        <Route path="/alumno" element={
          <ProtectedRoute allowedRoles={['alumno']}>
            <Alumnos />
          </ProtectedRoute>
        } />
        <Route path="/grupos/:code" element={
          <ProtectedRoute allowedRoles={['alumno','docente','coordinador']}>
            <Grupos></Grupos>
          </ProtectedRoute>
        }></Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
     </AuthProvider> );
}
import { AuthProvider } from './context/AuthContext.tsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Grupos from './pages/Grupos.tsx';
import Alumnos from './pages/Alumno.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import QuizResolve from './pages/QuizAlumno.tsx';
import QuizNuevo from './pages/QuizNuevo.tsx';
import GroupDetail from './pages/DetalleGrupo.tsx';
import Materias from './pages/Materias.tsx';
import AppLayout from './components/AppLayout.tsx';
import MisGrupos from './pages/MisGrupos.tsx';
import PlantelDashboard from './pages/PlantelDashboard.tsx';
import Planteles from './pages/Planteles.tsx';
import DirectoresPlanteles from './pages/DirectoresPlanteles.tsx';
import MetricasTroncoComun from './pages/MetricasTroncoComun.tsx';
import DirectorioDocentes from './pages/DirectorioDocentes.tsx';
import CatalogoAlumnos from './pages/CatalogoAlumnos.tsx';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<AppLayout />}>
            <Route path="/grupos" element={
              <ProtectedRoute allowedRoles={['docente', 'coordinador', 'directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <Grupos soloMisGrupos/>
              </ProtectedRoute>
            } />

            <Route path="/alumno" element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <Alumnos />
              </ProtectedRoute>
            } />
            <Route path="/plantel/directorio-docente" element={
              <ProtectedRoute allowedRoles={['coordinador','directorPlantel']}>
                <DirectorioDocentes />
              </ProtectedRoute>
             } />

            <Route path="/catalogo-grupos" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel', 'directorGeneral', 'admin', 'dev']}>
                <Grupos />
              </ProtectedRoute>
              } />

            <Route path="/catalogo-docentes" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel', 'directorGeneral']}>
                <DirectorioDocentes />
              </ProtectedRoute>
            } />
            <Route path="/catalogo-alumnos" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel', 'directorGeneral']}>
                <CatalogoAlumnos />
              </ProtectedRoute>
            } />

            <Route path="/alumno/grupos" element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <MisGrupos />
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/:quizId/resolver" element={
              <ProtectedRoute allowedRoles={['alumno']}>
                <QuizResolve/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code" element={
              <ProtectedRoute allowedRoles={['alumno', 'docente', 'coordinador', 'directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <GroupDetail/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/nuevo" element={
              <ProtectedRoute allowedRoles={['docente','coordinador']}>
                <QuizNuevo/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/:quizId/editar" element={
              <ProtectedRoute allowedRoles={['docente','coordinador']}>
                <QuizNuevo/>
              </ProtectedRoute>
            } />

            <Route path="/materias" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel']}>
                <Materias/>
              </ProtectedRoute>
            } />

            <Route path="/plantel/dashboard" element={
              <ProtectedRoute allowedRoles={['directorPlantel', 'directorGeneral', 'admin', 'dev']}>
                <PlantelDashboard />
              </ProtectedRoute>
            } />

            <Route path="/planteles" element={
              <ProtectedRoute allowedRoles={['directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <Planteles />
              </ProtectedRoute>
            } />

            <Route path="/directores-planteles" element={
              <ProtectedRoute allowedRoles={['directorPlantel', 'directorGeneral', 'admin', 'dev']}>
                <DirectoresPlanteles />
              </ProtectedRoute>
            } />

            <Route path="/metricas-tronco-comun" element={
              <ProtectedRoute allowedRoles={['directorGeneral', 'admin', 'dev']}>
                <MetricasTroncoComun />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
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
import MetricasGrupo from './pages/MetricasGrupo.tsx';
import ResultadosQuiz from './pages/ResultadosQuiz.tsx';
import DirectorioDocentes from './pages/DirectorioDocentes.tsx';
import CatalogoAlumnos from './pages/CatalogoAlumnos.tsx';
import LaboratorioAgente from './pages/LaboratorioAgente.tsx';
import MiPerfil from './pages/MiPerfil.tsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<AppLayout />}>
            <Route path="/laboratorio-agente" element={
              <ProtectedRoute allowedRoles={['dev']}>
                <LaboratorioAgente />
              </ProtectedRoute>
            } />
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

            <Route path="/plantel/dashboard" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel', 'directorGeneral', 'admin', 'dev']}>
                <PlantelDashboard />
              </ProtectedRoute>
            } />

            <Route path="/plantel/directorio-docente" element={
              <ProtectedRoute allowedRoles={['coordinador','directorPlantel', 'directorGeneral', 'admin', 'dev']}>
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

            <Route path="/grupos/:code/metricas" element={
              <ProtectedRoute allowedRoles={['docente', 'coordinador', 'directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <MetricasGrupo/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/nuevo" element={
              <ProtectedRoute allowedRoles={['docente','coordinador','directorGeneral','directorPlantel','admin','dev']}>
                <QuizNuevo/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/:quizId/editar" element={
              <ProtectedRoute allowedRoles={['docente','coordinador','directorGeneral','directorPlantel','admin','dev']}>
                <QuizNuevo/>
              </ProtectedRoute>
            } />

            <Route path="/grupos/:code/quizzes/:quizId/resultados" element={
              <ProtectedRoute allowedRoles={['docente', 'coordinador', 'directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <ResultadosQuiz/>
              </ProtectedRoute>
            } />

            <Route path="/materias" element={
              <ProtectedRoute allowedRoles={['coordinador', 'directorPlantel', 'directorGeneral', 'admin', 'dev']}>
                <Materias/>
              </ProtectedRoute>
            } />

            <Route path="/planteles" element={
              <ProtectedRoute allowedRoles={['directorGeneral', 'directorPlantel', 'admin', 'dev']}>
                <Planteles />
              </ProtectedRoute>
            } />

            <Route path="/directores-planteles" element={
              <ProtectedRoute allowedRoles={[ 'directorGeneral', 'admin', 'dev']}>
                <DirectoresPlanteles />
              </ProtectedRoute>
            } />

            <Route path="/metricas-tronco-comun" element={
              <ProtectedRoute allowedRoles={['docente','coordinador', 'directorPlantel' ,'directorGeneral', 'dev']}>
                <MetricasTroncoComun />
              </ProtectedRoute>
            } />

            <Route path="/mi-perfil" element={
            <ProtectedRoute allowedRoles={['directorGeneral' ,'directorPlantel', 'coordinador' ,'docente', 'alumno']}> <MiPerfil/>
              </ProtectedRoute>
          }></Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
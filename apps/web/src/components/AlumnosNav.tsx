import { NavLink } from 'react-router-dom';
import '../styles/AlumnoNav.css';

export default function AlumnoNav() {
  return (
    <nav className="an-nav">
      <NavLink to="/alumno" end className={({ isActive }) => `an-link ${isActive ? 'active' : ''}`}>
        <i className="bi bi-house"></i> Inicio
      </NavLink>
      <NavLink to="/alumno/grupos" className={({ isActive }) => `an-link ${isActive ? 'active' : ''}`}>
        <i className="bi bi-people"></i> Mis grupos
      </NavLink>
    </nav>
  );
}
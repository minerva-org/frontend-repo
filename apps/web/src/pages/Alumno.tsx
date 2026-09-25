import { useState, type SubmitEvent } from "react";
import { useNavigate} from "react-router-dom";
import {useAuth} from '../context/AuthContext'; 

interface Group {
  routeCode: string;
  grupo: string;
  docente: string | null;
  numeroEstudiantes: number;
  status: 'activo' | 'sin_docente' | 'archivado';
  atRisk: number;
  nextQuiz?: string;
  alumnosEmail: string[];
}

const INITIAL_GROUPS: Group[] = [
  {
    routeCode: 'MAT3-A',
    grupo: 'Matemáticas III — Grupo A',
    docente: 'Prof. García',
    numeroEstudiantes: 36,
    status: 'activo',
    atRisk: 1,
    nextQuiz: 'Lunes 28 de septiembre',
    alumnosEmail: ['alumno@chapala.edu.mx'],
  },
  {
    routeCode: 'FIS2-B',
    grupo: 'Física II — Grupo B',
    docente: 'Prof. Ruiz',
    numeroEstudiantes: 28,
    status: 'activo',
    atRisk: 0,
    nextQuiz: 'martes 29 de septiembre',
    alumnosEmail: [], // nuevo — este alumno no está inscrito aquí
  },
  {
    routeCode: 'PROG1-A',
    grupo: 'Programación I — Grupo A',
    docente: null,
    numeroEstudiantes: 30,
    status: 'sin_docente',
    atRisk: 0,
    nextQuiz: 'miercoles 30 de septiembre',
    alumnosEmail: [], // nuevo
  },
];

const JOIN_CODE_CATALOG: Record<string, Group> = {
  'FIS2B-26B': {
    routeCode: 'FIS2-B',
    grupo: 'Física II — Grupo B',
    docente: 'Prof. Ruiz',
    numeroEstudiantes: 28,
    status: 'activo',
    atRisk: 0,
    nextQuiz: 'Viernes 10:00 AM',
    alumnosEmail: [],
  },
};

export default function Alumno() {
  const { email } = useAuth();
  const navigate =useNavigate();
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const myGroups = groups.filter((g) => email !== null && g.alumnosEmail.includes(email));
  
  
  function handleJoin(e: SubmitEvent){
    e.preventDefault();
    setError(null);

    const normalizar = joinCode.trim().toUpperCase();
    if(!normalizar) return;

    const match = JOIN_CODE_CATALOG[normalizar];
    if(!match){
      setError('Código inválido. Verifica con tu profesor')
      return;
    }
    const alreadyJoined = myGroups.some((g) => g.routeCode === match.routeCode);
    if(alreadyJoined){
      setError('Ya estás inscrito en este curso')
      return;
    }

    const groupWithMe: Group = {
      ...match,
      alumnosEmail: email ? [...match.alumnosEmail,email] : match.alumnosEmail,
    };

    setGroups((prev) => {
      const exist = prev.some((g) => g.routeCode === groupWithMe.routeCode);
      return exist
        ? prev.map((g) => (g.routeCode ===groupWithMe.routeCode ? groupWithMe : g))
        : [...prev, groupWithMe];
    });
    setJoinCode('');
  }

  return (
  <section>
      <form onSubmit={handleJoin}>
        <h2>Ingrese código para inscribirse a un grupo</h2>
        <p></p>
        <article>
          <input 
          type="text" 
          placeholder="Ejemplo: MATCHAPA159"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          />

          <button type="submit">
            Unirme
          </button>
        </article>
        {error && <p>{error}</p>}
      </form>

      <article>
        {myGroups.map((group) => (
          <article key={group.routeCode} onClick={()  => navigate(`/grupos/${group.routeCode}`)}>
            <article>
              <span>{group.docente}</span>
              <span>{group.status}</span>
            </article>
            <h3>{group.grupo}</h3>
            <p>{group.nextQuiz}</p>
          </article>
        ))}

        {myGroups.length === 0 && <p>Aún no estas inscrito en ningun grupo</p>}
      </article>
  </section>
   
)}
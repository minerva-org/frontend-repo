import { useState, type FormEvent } from 'react';
import AutocompleteInput from './AutoCompleteInput';
import '../styles/ModalGrupos.css';

const MOCK_TEACHERS = [
  'Prof. García',
  'Prof. Ruiz',
  'Prof. Mendoza',
  'Prof. Torres',
  'Prof. Salinas',
];

const MOCK_STUDENTS = [
  'Ana López',
  'Carlos Pérez',
  'Diana Flores',
  'Eduardo Ramírez',
  'Fernanda Cruz',
  'Gabriel Ortiz',
  'Helena Vega',
  'Iván Morales',
];

export interface NewGroupData {
  subject: string;
  grade: string;
  teacher: string | null;
  students: string[];
}

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: NewGroupData) => void;
}

export default function CreateGroupModal({ onClose, onCreate }: CreateGroupModalProps) {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [teacher, setTeacher] = useState<string[]>([]);
  const [students, setStudents] = useState<string[]>([]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !grade.trim()) return;

    onCreate({
      subject: subject.trim(),
      grade: grade.trim(),
      teacher: teacher[0] ?? null,
      students,
    });
    onClose();
  }

  return (
    <article className="create-group-overlay">
      <article className="create-group-modal">
        <article className="create-group-header">
          <h2 className="create-group-title">Nuevo grupo</h2>
          <i className="bi bi-x-lg create-group-close" onClick={onClose}></i>
        </article>

        <form onSubmit={handleSubmit} className="create-group-form" noValidate>
          <label className="create-group-field">
            <span className="create-group-label">Materia</span>
            <input
              className="create-group-input"
              type="text"
              placeholder="Ej. Matemáticas III"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </label>

          <label className="create-group-field">
            <span className="create-group-label">Grado / Grupo</span>
            <input
              className="create-group-input"
              type="text"
              placeholder="Ej. 3.° Bachillerato — Grupo A"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />
          </label>

          <AutocompleteInput
            label="Docente"
            placeholder="Buscar docente..."
            options={MOCK_TEACHERS}
            selected={teacher}
            onChange={setTeacher}
          />

          <AutocompleteInput
            label="Alumnos"
            placeholder="Buscar y agregar alumnos..."
            options={MOCK_STUDENTS}
            multiple
            selected={students}
            onChange={setStudents}
          />

          <article className="create-group-actions">
            <button type="button" className="create-group-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="create-group-submit">
              Crear grupo
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}
import { createPortal } from 'react-dom';
import type { FormEvent } from 'react';

export interface DirectorFormState {
  nombreCompleto: string;
  email: string;
  plantelId: number;
  password: string;
}

interface PlantelItem {
  id: number;
  nombre: string;
  activo: boolean;
}

interface DirectorPlantelModalProps {
  isOpen: boolean;
  editingId: string | null;
  form: DirectorFormState;
  formError: string | null;
  loading: boolean;
  hasError?: boolean;
  isValidating?: boolean;
  planteles: PlantelItem[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (next: DirectorFormState) => void;
}

const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function DirectorPlantelModal({
  isOpen,
  editingId,
  form,
  formError,
  loading,
  hasError = false,
  isValidating = false,
  planteles,
  onClose,
  onSubmit,
  onChange,
}: DirectorPlantelModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <article className="dp-modal-overlay">
      <article className="dp-modal">
        <header className="dp-modal-header">
          <article>
            <h2 className="dp-modal-title">{editingId ? 'Editar director plantel' : 'Nuevo director plantel'}</h2>
            <p className="dp-modal-subtitle">{editingId ? 'Actualiza los datos del registro' : 'Captura los datos del nuevo registro'}</p>
          </article>
        </header>

        <form onSubmit={onSubmit} className="dp-modal-form">
          <label className="dp-field">
            <span className="dp-field-label">Nombre completo</span>
            <input
              className="dp-input"
              value={form.nombreCompleto}
              placeholder="Nuevo director plantel"
              onChange={(e) => onChange({ ...form, nombreCompleto: e.target.value })}
            />
          </label>

          <label className="dp-field">
            <span className="dp-field-label">Correo institucional</span>
            <div className="dp-email-row">
              <input
                className="dp-input dp-email-input"
                type="text"
                value={form.email}
                placeholder="ejemplo.director"
                onChange={(e) => onChange({ ...form, email: e.target.value })}
              />
              <span className="dp-email-domain">@chapala.edu.mx</span>
            </div>
          </label>

          {!editingId && (
            <label className="dp-field">
              <span className="dp-field-label">Contraseña temporal</span>
              <div className="dp-password-row">
                <input
                  className="dp-input dp-password-input"
                  type="text"
                  value={form.password}
                  placeholder="Ej. Dir#2026Segura"
                  onChange={(e) => onChange({ ...form, password: e.target.value })}
                />
              </div>
              <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--groups-texto-suave)' }}>
                Debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.
              </small>
            </label>
          )}

          <label className="dp-field">
            <span className="dp-field-label">Plantel de adscripción</span>
            <select
              className="dp-input"
              value={form.plantelId}
              onChange={(e) => onChange({ ...form, plantelId: Number(e.target.value || 1) })}
            >
              {planteles.map((plantel) => (
                <option key={plantel.id} value={plantel.id}>{plantel.nombre}</option>
              ))}
            </select>
          </label>

          {hasError && formError && (
            <p className="dp-empty" style={{ padding: 0, textAlign: 'left', color: 'var(--seige-error-texto)' }}>
              {formError}
            </p>
          )}

          <footer className="dp-modal-actions">
            <button type="button" className="dp-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dp-btn-primary" disabled={loading || isValidating}>
              {isValidating ? 'Validando...' : loading ? 'Guardando...' : 'Guardar'}
            </button>
          </footer>
        </form>
      </article>
    </article>,
    document.body,
  );
}

export function isStrongPassword(password: string) {
  return SAFE_PASSWORD_REGEX.test(password.trim());
}

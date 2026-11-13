
import { createPortal } from 'react-dom';
import type { SubmitEvent } from 'react';

export interface DirectorFormState {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  numeroTelefono: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  plantelId: number;
  password: string;
}

export interface PlantelItem {
  id: number;
  nombre: string;
  activo?: boolean;
}

interface DirectorPlantelModalProps {
  isOpen: boolean;
  editingId: string | null;
  form: DirectorFormState;
  formError: string | null;
  loading: boolean;
  isValidating?: boolean;
  planteles: PlantelItem[];
  onClose: () => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onChange: (next: DirectorFormState) => void;
}

const SAFE_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function DirectorPlantelModal({
  isOpen,
  editingId,
  form,
  formError,
  loading,
  isValidating = false,
  planteles,
  onClose,
  onSubmit,
  onChange,
}: DirectorPlantelModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <article
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dp-modal-title"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <article className="modal-dialog modal-xl modal-dialog-centered">
        <article className="modal-content border-0 shadow modal-docentes-content">
          <header
            className="modal-header text-white"
            style={{
              background: 'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
              borderBottom: 'none',
            }}
          >
            <article>
              <h2 className="modal-title fs-5 fw-bold text-white" id="dp-modal-title">
                {editingId ? 'Editar director de plantel' : 'Registrar director de plantel'}
              </h2>
              <p className="small mb-0" style={{ color: 'var(--ar-neblina)' }}>
                {editingId ? 'Actualiza la información del director' : 'Alta de directores de plantel'}
              </p>
            </article>

          </header>

          <form id="form-director-plantel" onSubmit={onSubmit}>
            <section className="modal-body p-4">
              <article className="row g-3">

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Nombre(s)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.nombre}
                    required
                    maxLength={50}
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                    placeholder='Ejemplo: Juan'
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Apellido paterno</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.apellidoPaterno}
                    required
                    maxLength={50}
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, apellidoPaterno: e.target.value })}
                    placeholder='Ejemplo: Perez'
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Apellido materno</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.apellidoMaterno}
                    required
                    maxLength={50}
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, apellidoMaterno: e.target.value })}
                    placeholder='Ejemplo: López'
                  />
                </article>

                <article className="col-6">
                  <label className="form-label fw-semibold">Correo institucional</label>
                  <article className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={form.email}
                      placeholder="ejemplo.director"
                      required
                      maxLength={50}
                      disabled={loading}
                      onChange={(e) => onChange({ ...form, email: e.target.value })}
                    />
                    <span className="input-group-text">@chapala.edu.mx</span>
                  </article>
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Número telefónico</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={form.numeroTelefono}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="10 dígitos"
                    required
                    disabled={loading}
                    onChange={(e) =>
                      onChange({
                        ...form,
                        numeroTelefono: e.target.value.replace(/\D/g, '').slice(0, 10),
                      })
                    }
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Calle</label>
                  <input
                    className="form-control"
                    value={form.calle}
                    maxLength={50}
                    required
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, calle: e.target.value })}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Colonia</label>
                  <input
                    className="form-control"
                    value={form.colonia}
                    maxLength={50}
                    required
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, colonia: e.target.value })}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Municipio</label>
                  <input
                    className="form-control"
                    value={form.municipio}
                    maxLength={50}
                    required
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, municipio: e.target.value })}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Estado</label>
                  <input
                    className="form-control"
                    value={form.estado}
                    maxLength={50}
                    required
                    disabled={loading}
                    onChange={(e) => onChange({ ...form, estado: e.target.value })}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Código postal</label>
                  <input
                    className="form-control"
                    value={form.codigoPostal}
                    maxLength={5}
                    pattern="[0-9]{5}"
                    required
                    disabled={loading}
                    onChange={(e) =>
                      onChange({
                        ...form,
                        codigoPostal: e.target.value.replace(/\D/g, '').slice(0, 5),
                      })
                    }
                  />
                </article>

                <article className="col-12 mt-6"  >
                  <h6 className="fw-bold">Asignación de plantel</h6>
                  <select
                    className="form-select"
                    value={form.plantelId}
                    required
                    disabled={loading || planteles.length === 0}
                    onChange={(e) =>
                      onChange({ ...form, plantelId: Number(e.target.value) })
                    }
                  >
                    <option value={0} disabled>Selecciona un plantel</option>
                    {planteles
                      .filter((plantel) => plantel.activo !== false)
                      .map((plantel) => (
                        <option key={plantel.id} value={plantel.id}>
                          {plantel.nombre}
                        </option>
                      ))}
                  </select>
                </article>

                {!editingId && (
                  <article className="col-12 mt-6">
                    <label className="form-label fw-semibold">Contraseña temporal</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      autoComplete="new-password"
                      value={form.password}
                      minLength={8}
                      required
                      disabled={loading}
                      onChange={(e) => onChange({ ...form, password: e.target.value })}
                    />
                    <small className="text-muted">
                      Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
                    </small>
                  </article>
                )}

                {formError && (
                  <article className="col-12">
                    <article className="alert alert-danger mb-0" role="alert">
                      {formError}
                    </article>
                  </article>
                )}

              </article>
            </section>

            <footer className="modal-footer border-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || isValidating || planteles.length === 0}
              >
                {isValidating
                  ? 'Validando...'
                  : loading
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Registrar director'}
              </button>
            </footer>
          </form>

        </article>
      </article>
    </article>,
    document.body,
  );
}

export function isStrongPassword(password: string) {
  return SAFE_PASSWORD_REGEX.test(password);
}

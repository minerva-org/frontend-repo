import type {DocenteModalProps} from '../../types/DocenteTypes';

export function DocenteModal({ planteles, docente, loading, form, formError, onClose, onSubmit, onChange, canChoosePlantel, hidePlantelField, hideRoleField, defaultPlantelName }: DocenteModalProps) {
  return (
    <article className="dd-modal-overlay">
      <article className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-modal-title">
        <article className="dd-modal-header">
          <article>
            <h2 id="dd-modal-title" className="dd-modal-title">
              {docente ? 'Editar docente' : 'Nuevo docente'}
            </h2>
            <p className="dd-modal-subtitle">Alta y edición de usuarios docentes</p>
          </article>
        </article>

        <form className="dd-modal-form" onSubmit={onSubmit}>
          <label className="dd-field">
            <span className="dd-field-label">Nombre(s)</span>
            <input
              className="dd-input"
              type="text"
              value={form.nombre}
              onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              placeholder="Ej. Juan Carlos"
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Apellido paterno</span>
            <input
              className="dd-input"
              type="text"
              value={form.apellidoPaterno}
              onChange={(e) => onChange({ ...form, apellidoPaterno: e.target.value })}
              placeholder="Ej. Méndez"
              required
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Apellido materno</span>
            <input
              className="dd-input"
              type="text"
              value={form.apellidoMaterno}
              onChange={(e) => onChange({ ...form, apellidoMaterno: e.target.value })}
              placeholder="Ej. García"
            />
          </label>

          <label className="dd-field">
            <span className="dd-field-label">Correo institucional</span>
            <article className="dd-email-row">
              <input
                className="dd-input dd-email-input"
                type="text"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                placeholder="ejemplo.nombre"
                required
              />
              <span className="dd-email-domain">@chapala.edu.mx</span>
            </article>
          </label>

            <label className="dd-field">
                <span className="dd-field-label">Teléfono</span>
                <input
                className="dd-input"
                type="text"
                value={form.numeroTelefono}
                onChange={(e) => onChange({ ...form, numeroTelefono: e.target.value })}
                placeholder="Ej. 667 234 5678"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Calle</span>
                <input
                className="dd-input"
                type="text"
                value={form.calle}
                onChange={(e) => onChange({ ...form, calle: e.target.value })}
                placeholder="Ej. Av. Chapala #123"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Colonia</span>
                <input
                className="dd-input"
                type="text"
                value={form.colonia}
                onChange={(e) => onChange({ ...form, colonia: e.target.value })}
                placeholder="Ej. Centro"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Código Postal</span>
                <input
                className="dd-input"
                type="text"
                value={form.codigoPostal}
                onChange={(e) => onChange({ ...form, codigoPostal: e.target.value })}
                placeholder="Ej. 12345"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Municipio</span>
                <input
                className="dd-input"
                type="text"
                value={form.municipio}
                onChange={(e) => onChange({ ...form, municipio: e.target.value })}
                placeholder="Ej. Chapala"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Estado</span>
                <input
                className="dd-input"
                type="text"
                value={form.estado}
                onChange={(e) => onChange({ ...form, estado: e.target.value })}
                placeholder="Ej. Jalisco"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Carrera</span>
                <input
                className="dd-input"
                type="text"
                value={form.carrera}
                onChange={(e) => onChange({ ...form, carrera: e.target.value })}
                placeholder="Ej. Ingeniería en Sistemas Computacionales"
                required
                />
            </label>

            <label className="dd-field">
                <span className="dd-field-label">Título educativo</span>
                <input
                className="dd-input"
                type="text"
                value={form.tituloEdu}
                onChange={(e) => onChange({ ...form, tituloEdu: e.target.value })}
                placeholder="Ej. Licenciatura en Ingeniería en Sistemas Computacionales"
                required
                />
            </label>
            


          {!hidePlantelField && canChoosePlantel ? (
            <label className="dd-field">
              <span className="dd-field-label">Plantel</span>
              <select
                className="dd-input"
                value={form.plantelId ?? ''}
                onChange={(e) => onChange({ ...form, plantelId: Number(e.target.value) || null })}
                required
              >
                <option value="">Selecciona un plantel</option>
                {planteles.map((plantel) => (
                  <option key={plantel.id} value={plantel.id}>
                    {plantel.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : !hidePlantelField ? (
            <label className="dd-field">
              <span className="dd-field-label">Plantel</span>
              <input className="dd-input" type="text" value={defaultPlantelName} readOnly />
            </label>
          ) : null}

          {!docente && !hideRoleField && (
            <label className="dd-field">
              <span className="dd-field-label">Rol</span>
              <select
                className="dd-input"
                value={form.rol}
                onChange={(e) => onChange({ ...form, rol: e.target.value as 'DOCENTE' | 'COORDINADOR' })}
              >
                <option value="DOCENTE">Docente</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>
            </label>
          )}

          {!docente && (
            <label className="dd-field">
              <span className="dd-field-label">Contraseña temporal</span>
              <input
                className="dd-input"
                type="password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                placeholder="Ej. Doc#2026Segura"
                required
              />
              <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--dd-texto-suave)' }}>
                Debe incluir mayúsculas, minúsculas, números y un símbolo; mínimo 8 caracteres.
              </small>
            </label>
          )}

          {formError && <p className="dd-field-hint" style={{ color: 'var(--seige-error-texto)' }}>{formError}</p>}

          <article className="dd-modal-actions">
            <button type="button" className="dd-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dd-btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}

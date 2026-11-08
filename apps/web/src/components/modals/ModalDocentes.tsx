
import type { DocenteModalProps } from '../../types/DocenteTypes';

export function DocenteModal({
  planteles,
  docente,
  loading,
  form,
  formError,
  onClose,
  onSubmit,
  onChange,
  canChoosePlantel,
  hidePlantelField,
  hideRoleField,
  defaultPlantelName,
}: DocenteModalProps) {
  return (
    <article className="modal show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dd-modal-title" style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }} >
      <article className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <article className="modal-content border-0 shadow">
        <article className="modal-header text-white" style={{
            background: 'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
            borderBottom: 'none',
          }}
        >
          <article>
            <h2 className="modal-title fs-5 fw-bold text-white" id="dd-modal-title">
              {docente ? 'Editar docente' : 'Nuevo docente'}
            </h2>

            <p className="small mb-0" style={{ color: 'var(--ar-neblina)' }}>
              Alta y edición de usuarios docentes
            </p>
          </article>

          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={loading}
          />
        </article>

          <form onSubmit={onSubmit}>

            <article className="modal-body">
              <article className="row g-3">

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Nombre(s)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.nombre ?? ''}
                    onChange={(e) => onChange({...form, nombre: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Apellido paterno
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.apellidoPaterno ?? ''}
                    onChange={(e) => onChange({...form,apellidoPaterno: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Apellido materno
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.apellidoMaterno ?? ''}
                    onChange={(e) => onChange({...form,apellidoMaterno: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Correo institucional
                  </label>

                  <article className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={form.email ?? ''}
                      onChange={(e) => onChange({...form,email: e.target.value})}
                    />

                    <span className="input-group-text">
                      @chapala.edu.mx
                    </span>
                  </article>
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={form.numeroTelefono ?? ''}
                    onChange={(e) => onChange({...form,numeroTelefono: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Calle
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.calle ?? ''}
                    onChange={(e) => onChange({...form,calle: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Colonia
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.colonia ?? ''}
                    onChange={(e) => onChange({...form,colonia: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.codigoPostal ?? ''}
                    onChange={(e) => onChange({...form,codigoPostal: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Municipio
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.municipio ?? ''}
                    onChange={(e) => onChange({...form,municipio: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Estado
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.estado ?? ''}
                    onChange={(e) => onChange({...form,estado: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Carrera
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.carrera ?? ''}
                    onChange={(e) => onChange({...form, carrera: e.target.value})}
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Título educativo
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.tituloEdu ?? ''}
                    onChange={(e) => onChange({...form, tituloEdu: e.target.value})}
                  />
                </article>

                {!hidePlantelField && (
                  <article className="col-md-6">
                    <label className="form-label fw-semibold">
                      Plantel
                    </label>

                    {canChoosePlantel ? (
                      <select
                        className="form-select"
                        value={form.plantelId ?? ''}
                        onChange={(e) => onChange({...form, plantelId: Number(e.target.value)})}
                      >
                        <option value="">Selecciona un plantel</option>

                        {planteles.map((plantel) => (
                          <option key={plantel.id} value={plantel.id}>
                            {plantel.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        value={defaultPlantelName ?? ''}
                        disabled
                      />
                    )}
                  </article>
                )}

                {!docente && !hideRoleField && (
                  <article className="col-md-6">
                    <label className="form-label fw-semibold">
                      Rol
                    </label>

                    <select
                      className="form-select"
                      value={form.rol ?? ''}
                      onChange={(e) => onChange({...form,rol: e.target.value as 'DOCENTE' || 'COORDINADOR'})}
                    >
                      <option value="DOCENTE">Docente</option>
                      <option value="DIRECTOR_PLANTEL">Coordinador</option>
                    </select>
                  </article>
                )}

                {!docente && (
                  <article className="col-12">
                    <label className="form-label fw-semibold">
                      Contraseña temporal
                    </label>

                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={form.password ?? ''}
                      onChange={(e) => onChange({...form,password: e.target.value})}
                    />

                    <article className="form-text">
                      Debe contener al menos 8 caracteres, mayúsculas,
                      minúsculas, números y caracteres especiales.
                    </article>
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
            </article>

            {/* Acciones */}
            <article className="modal-footer">
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </article>

          </form>
        </article>
      </article>
    </article>
  );
}

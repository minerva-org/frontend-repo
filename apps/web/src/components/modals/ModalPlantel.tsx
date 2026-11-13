
interface Institucion {
  id: number;
  nombre: string;
}

interface PlantelForm {
  nombre: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  institucionId: number | null;
}

interface PlantelModalProps {
  plantel: PlantelForm | null;
  instituciones: Institucion[];
  loading: boolean;
  form: PlantelForm;
  formError: string | null;
  onClose: () => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onChange: (form: PlantelForm) => void;
}

export function PlantelModal({
  plantel,
  instituciones,
  loading,
  form,
  formError,
  onClose,
  onSubmit,
  onChange,
}: PlantelModalProps) {
  return (
    <article
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pl-modal-title"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <article className="modal-dialog modal-xl modal-dialog-centered">
        <article className="modal-content border-0 shadow modal-docentes-content">

          <article
            className="modal-header text-white"
            style={{
              background: 'linear-gradient(135deg, var(--ar-profundo), var(--ar-azul))',
              borderBottom: 'none',
            }}
          >
            <article>
              <h2 className="modal-title fs-5 fw-bold text-white" id="pl-modal-title">
                {plantel ? 'Editar plantel' : 'Nuevo plantel'}
              </h2>

              <p className="small mb-0" style={{ color: 'var(--ar-neblina)' }}>
                Alta y edición de planteles escolares
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

          <form id="form-plantel" onSubmit={onSubmit}>
            <article className="modal-body modal-docentes-body">
              <article className="row g-3">

                <article className="col-12">
                  <label className="form-label fw-semibold">
                    Nombre del plantel
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.nombre}
                    onChange={(e) => onChange({ ...form, nombre: e.target.value })}
                    required
                    maxLength={100}
                    placeholder="Ejemplo: Plantel sur"
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Código postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.codigoPostal}
                    onChange={(e) => onChange({ ...form, codigoPostal: e.target.value })}
                    required
                    inputMode="numeric"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    title="El código postal debe contener exactamente 5 dígitos."
                    placeholder="Ejemplo: 80181"
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Estado
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.estado}
                    onChange={(e) => onChange({ ...form, estado: e.target.value })}
                    required
                    maxLength={80}
                    disabled
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Municipio
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.municipio}
                    onChange={(e) => onChange({ ...form, municipio: e.target.value })}
                    required
                    maxLength={80}
                    disabled
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Colonia
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.colonia}
                    onChange={(e) => onChange({ ...form, colonia: e.target.value })}
                    required
                    maxLength={80}
                    disabled
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Calle
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.calle}
                    onChange={(e) => onChange({ ...form, calle: e.target.value })}
                    required
                    maxLength={100}
                    placeholder="Ejemplo: Av. Alvaro Obregon"
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Institución
                  </label>
                  <select
                    className="form-select"
                    value={form.institucionId ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...form,
                        institucionId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    required
                  >
                    <option value="">Selecciona una institución</option>
                    {instituciones.map((institucion) => (
                      <option key={institucion.id} value={institucion.id}>
                        {institucion.nombre}
                      </option>
                    ))}
                  </select>
                </article>

                {formError && (
                  <article className="col-12">
                    <article className="alert alert-danger mb-0" role="alert">
                      {formError}
                    </article>
                  </article>
                )}

              </article>
            </article>
          </form>

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
              form="form-plantel"
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
        </article>
      </article>
    </article>
  );
}

import { useSepomex } from '../../hooks/useSepomex';
import type {Institucion, PlantelForm} from '../../types/PlantelTypes.ts';

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
  const {
    colonias,
    buscandoCP,
    errorCP,
    consultarCP,
    limpiarCP,
  } = useSepomex();

  const handleConsultarCP = async() => {
    const resultados = await consultarCP(form.codigoPostal ?? '');
    if(!resultados){
      return;
    }
    onChange({
      ...form,
      estado: resultados[0].d_estado,
      municipio: resultados[0].d_mnpio,
      colonia: resultados.length === 1 ? resultados[0].d_asenta : '',
    });
  };
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
                  <label className="form-label fw-semibold">Código postal</label>
                  <input
                    className="form-control"
                    type='text'
                    value={form.codigoPostal ?? ''}
                    maxLength={5}
                    pattern="[0-9]{5}"
                    placeholder='Ejemplo: 80150'
                    required
                    disabled={loading || buscandoCP}
                    onChange={(e) =>{
                      onChange({
                        ...form, 
                        codigoPostal:e.target.value.replace(/\D/g, '').slice(0,5), 
                        colonia: '', 
                        municipio: '', 
                        estado: '',                      
                      });

                      limpiarCP();
                    }}
                    onKeyDown={(e) =>  {
                      if(e.key === 'Enter'){
                        e.preventDefault();
                        handleConsultarCP();
                      }
                    }}
                  />

                  {buscandoCP && (
                    <small> Consultando código postal</small>
                  )}

                  {errorCP && (
                    <small>{errorCP}</small>
                  )}
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">
                    Estado
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.estado}
                    readOnly
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
                    readOnly
                  />
                </article>

                <article className="col-md-6">
                  <label className="form-label fw-semibold">Colonia</label>
                  <select
                    className="form-select"
                    value={form.colonia ?? ''}
                    required
                    disabled={loading || colonias.length === 0 || buscandoCP} 
                    onChange={(e) => onChange({ ...form, colonia: e.target.value })} 
                  >
                    <option value="">Seleccione una colonia</option>

                    {colonias.map((colonia) =>(
                      <option key={colonia.id} value={colonia.d_asenta}>
                        {colonia.d_asenta}
                      </option>
                    ))}
                    </select>
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

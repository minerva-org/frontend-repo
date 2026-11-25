
import type { DocenteModalProps } from '../../types/DocenteTypes';
import { useSepomex } from '../../hooks/useSepomex';

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
    <article className="modal show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dd-modal-title" style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }} >
      <article className="modal-dialog modal-xl modal-dialog-centered">
        <article className="modal-content border-0 shadow modal-docentes-content">
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

        </article>

          <form id="form-docente" onSubmit={onSubmit}>

            <article className="modal-body modal-docentes-body">
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
                    required
                    maxLength={50}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+([ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*"
                    title="Sin caracteres especiales ni numeros"
                    placeholder='Ejemplo: Juan'
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
                    required
                    maxLength={50}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+([ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*"
                    title="Sin caracteres especiales ni numeros"
                    placeholder='Ejemplo: Perez'
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
                    maxLength={50}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+([ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*"
                    title="Sin caracteres especiales ni numeros"
                    placeholder='Ejemplo: López'
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
                      required
                      maxLength={64}
                      pattern="[A-Za-z0-9._%+-]+"
                      title="Ingresa la parte inicial sin espacios."
                      placeholder='juan.p'
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
                    required={!docente}
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="El teléfono debe contener exactamente 10 dígitos."
                    placeholder='XXX-XXXX-XXX'
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
                    placeholder='XXXXX'
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
                    onBlur={() => {
                      if ((form.codigoPostal ?? '').length === 5 && !form.municipio && !buscandoCP){
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
                    value={form.estado ?? ''}
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
                    value={form.municipio ?? ''}
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
                    value={form.calle ?? ''}
                    onChange={(e) => onChange({...form,calle: e.target.value})}
                    required
                    maxLength={100}
                    placeholder='Av. Alvaro Obregon '
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
                    required
                    maxLength={100}
                    placeholder='Ing. en sistemas'
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
                    required
                    maxLength={100}
                    placeholder='Lic en sistemas'
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
                        required
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
                      onChange={(e) => onChange({...form,rol: e.target.value as 'DOCENTE' | 'COORDINADOR',})}
                    >
                      <option value="DOCENTE">Docente</option>
                      <option value="COORDINADOR">Coordinador</option>
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
                      required
                      minLength={8}
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}"
                      title="Debe contener mayúsculas, minúsculas, números y símbolos."
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
                form= "form-docente"
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


import { useEffect, useState, useCallback, type SubmitEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext.tsx';
import { fetchPersonaById } from '../services/personaService.ts';
import type { PersonaRecord } from '../types/PersonaTypes.ts';
import { fetchPlantelById } from '../services/plantelService.ts';
import type { PlantelRecord } from '../types/PlantelTypes.ts';
import { cambiarPassword, validarPassword } from '../services/passwordService.ts';
import Toast, {type ToastData }from '../components/common/Toast.tsx' 

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <article className="col-12 col-md-6">
    <label className="form-label text-secondary mb-0">
      {label}
    </label>

    <p className="fw-semibold mb-1">
      {value !== null && value !== undefined && value !== ''
        ? value
        : 'No disponible'}
    </p>
  </article>
);

export default function MiPerfil() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  const [persona, setPersona] = useState<PersonaRecord | null>(null);
  const [plantel, setPlantel] = useState<PlantelRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const personaId = user?.personaId ?? user?.id;

  // Estados del modal de cambio de contraseña
  const [passwordValidada, setPasswordValidada] = useState(false);
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const cerrarToast = useCallback(() => { setToast(null);}, []);

  // Controla cuál contraseña está visible
  const [passwordVisible, setPasswordVisible] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function cargarPerfil() {
      if (!personaId) {
        setError('No se encontró el identificador del usuario.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setPersona(null);
        setPlantel(null);

        // Obtener información de la persona
        const response = await fetchPersonaById(personaId);

        if (!active) return;

        setPersona(response.data);

        // Obtener información del plantel
        if (response.data.plantelId != null) {
          try {
            const plantelResponse = await fetchPlantelById(
              response.data.plantelId
            );

            if (!active) return;

            setPlantel(plantelResponse.data);
          } catch (error) {
            console.error(
              'Error al obtener los datos del plantel:',
              error
            );
          }
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);

        if (active) {
          setError('No fue posible cargar la información del perfil.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    cargarPerfil();

    return () => {
      active = false;
    };
  }, [personaId]);

  function formatearFecha(fecha: string | null | undefined) {
    if (!fecha) return 'No disponible';

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return 'No disponible';

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  const nombreCompleto = persona
    ? [
        persona.nombre,
        persona.apellidoPaterno,
        persona.apellidoMaterno,
      ].filter(Boolean).join(' ')
    : '';

  async function handleValidarPassword() {
    setErrorPassword(null);

    if (!currentPassword.trim()) {
      setErrorPassword('Introduce tu contraseña actual.');
      return;
    }

    try {
      setCambiandoPassword(true);

      await validarPassword(currentPassword);

      setPasswordValidada(true);
      setErrorPassword(null);
    } catch (error) {
      console.error('Error al validar la contraseña:', error);

      setPasswordValidada(false);
      setErrorPassword('La contraseña actual es incorrecta.');
    } finally {
      setCambiandoPassword(false);
    }
  }

  async function handleCambiarPassword(
    event: SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErrorPassword(null);

    if (!newPassword.trim()) {
      setErrorPassword('Introduce una nueva contraseña.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorPassword('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    try {
      setCambiandoPassword(true);

      await cambiarPassword({
        currentPassword,
        newPassword,
      });

      setMostrarModalPassword(false);
      setPasswordValidada(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordVisible(null);
      setToast({
        mensaje: '¡Tu contraseña se cambió correctamente!',
        tipo: 'exito',
        });
    } catch {
        setToast({
            mensaje: 'No fue posible cambiar la contraseña. Inténtalo nuevamente.',
            tipo: 'error',
            });
    } finally {
      setCambiandoPassword(false);
    }
  }

  function cerrarModalPassword() {
    setMostrarModalPassword(false);
    setPasswordValidada(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordVisible(null);
    setErrorPassword(null);
  }

  return (
    <>
      <main
        className="min-vh-100"
        style={{
          background: 'var(--seige-fondo)',
          color: 'var(--seige-texto)',
        }}
      >
        {/* Encabezado superior */}
        <header
          className="d-flex align-items-center justify-content-between gap-3 px-3 py-3 text-white sticky-top"
          style={{
            zIndex: 10,
            paddingInline: '1rem',
            background: `linear-gradient(
              135deg,
              var(--ar-profundo),
              color-mix(in srgb, var(--ar-profundo) 60%, var(--ar-azul))
            )`,
          }}
        >
          <article className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn border-0 p-1 text-white"
              onClick={toggleSidebar}
              title="Mostrar u ocultar menú"
              aria-label="Mostrar u ocultar menú"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            <span className="fw-bold fs-5">Mi perfil</span>
          </article>
        </header>

        {/* Contenido */}
        <section
          className="mx-auto d-flex flex-column gap-3"
          style={{
            marginTop: '30px',
            width: '100%',
            maxWidth: '72rem',
            padding: '0 1rem 2rem',
          }}
        >
          {/* Presentación de la página */}
          <article
            className="p-4 text-white rounded-4"
            style={{
              background: `linear-gradient(
                135deg,
                var(--ar-profundo),
                color-mix(in srgb, var(--ar-azul) 75%, var(--ar-acero))
              )`,
            }}
          >
            <h1 className="h4 fw-bold mb-0">Mi perfil</h1>
          </article>

          {loading ? (
            <article className="d-flex justify-content-center align-items-center py-5">
              <article className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </article>
            </article>
          ) : error || !persona ? (
            <article className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error ?? 'No se encontró la información del perfil.'}
            </article>
          ) : (
            <>
              {/* Presentación del usuario */}
              <section className="card shadow-sm rounded-4">
                <article className="card-body p-3">
                  <article className="d-flex align-items-center gap-3">
                    <article
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'var(--ar-neblina)',
                        color: 'var(--ar-profundo)',
                        fontSize: '1.6rem',
                      }}
                    >
                      <i className="bi bi-person-fill"></i>
                    </article>

                    <article>
                      <h5 className="fw-bold mb-1">{nombreCompleto}</h5>
                      <span className="text-secondary">{persona.rol}</span>
                    </article>

                    <article className="ms-auto d-flex align-items-center gap-2">
                      <span className="text-secondary">Estatus:</span>
                      <span
                        className={`badge rounded-pill ${
                          persona.activo
                            ? 'text-bg-success'
                            : 'text-bg-secondary'
                        }`}
                      >
                        {persona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </article>
                  </article>
                </article>
              </section>

              {/* Tarjetas de información */}
              <article className="row g-3">

                {/* Información personal */}
                <article className="col-12 col-lg-6">
                  <section className="card shadow-sm rounded-4 h-100">
                    <article className="card-body p-3">
                      <h5 className="fw-bold mb-3">
                        <i className="bi bi-person-vcard me-2"></i>
                        Información personal
                      </h5>

                      <article className="row g-3">
                        <InfoItem label="Nombre" value={persona.nombre} />
                        <InfoItem label="Apellido paterno" value={persona.apellidoPaterno} />
                        <InfoItem label="Apellido materno" value={persona.apellidoMaterno} />
                        <InfoItem label="Correo electrónico" value={persona.email} />
                        <InfoItem label="Número telefónico" value={persona.numeroTelefono} />
                      </article>
                    </article>
                  </section>
                </article>

                {/* Dirección */}
                <article className="col-12 col-lg-6">
                  <section className="card shadow-sm rounded-4 h-100">
                    <article className="card-body p-3">
                      <h5 className="fw-bold mb-3">
                        <i className="bi bi-geo-alt me-2"></i>
                        Dirección
                      </h5>

                      <article className="row g-3">
                        <InfoItem label="Calle" value={persona.calle} />
                        <InfoItem label="Colonia" value={persona.colonia} />
                        <InfoItem label="Código postal" value={persona.codigoPostal} />
                        <InfoItem label="Municipio" value={persona.municipio} />
                        <InfoItem label="Estado" value={persona.estado} />
                      </article>
                    </article>
                  </section>
                </article>

                {/* Información académica del docente */}
                {persona.rol === 'DOCENTE' && (
                  <article className="col-12 col-lg-6">
                    <section className="card shadow-sm rounded-4 h-100">
                      <article className="card-body p-3">
                        <h5 className="fw-bold mb-3">
                          <i className="bi bi-mortarboard me-2"></i>
                          Información académica
                        </h5>

                        <article className="row g-3">
                          <InfoItem label="Carrera" value={persona.carrera} />
                          <InfoItem label="Título educativo" value={persona.tituloEdu} />
                          <InfoItem label="Plantel" value={plantel?.nombre} />
                        </article>
                      </article>
                    </section>
                  </article>
                )}

                {/* Información académica del alumno */}
                {persona.rol === 'ALUMNO' && (
                  <>
                    <article className="col-12 col-lg-6">
                      <section className="card shadow-sm rounded-4 h-100">
                        <article className="card-body p-3">
                          <h5 className="fw-bold mb-3">
                            <i className="bi bi-mortarboard me-2"></i>
                            Información académica
                          </h5>

                          <article className="row g-3">
                            <InfoItem label="Plantel" value={plantel?.nombre} />
                            <InfoItem
                              label="Fecha de ingreso"
                              value={formatearFecha(persona.fechaIngreso)}
                            />
                          </article>
                        </article>
                      </section>
                    </article>

                    {/* Información del tutor */}
                    <article className="col-12 col-lg-6">
                      <section className="card shadow-sm rounded-4 h-100">
                        <article className="card-body p-3">
                          <h5 className="fw-bold mb-3">
                            <i className="bi bi-people me-2"></i>
                            Información del tutor
                          </h5>

                          <article className="row g-3">
                            <InfoItem
                              label="Nombre del tutor"
                              value={persona.nombreTutor}
                            />
                            <InfoItem
                              label="Teléfono del tutor"
                              value={persona.numeroTutor}
                            />
                          </article>
                        </article>
                      </section>
                    </article>
                  </>
                )}
              </article>

              {/* Botón para cambiar contraseña */}
              <button
                type="button"
                className="btn text-white"
                style={{ backgroundColor: 'var(--ar-profundo)' }}
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordValidada(false);
                  setPasswordVisible(null);
                  setErrorPassword(null);
                  setMostrarModalPassword(true);
                }}
              >
                <i className="bi bi-key me-2"></i>
                Cambiar contraseña
              </button>
            </>
          )}
        </section>
      </main>

      {/* Modal de cambio de contraseña */}
      {mostrarModalPassword && (
        <article
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <article className="modal-dialog modal-dialog-centered">
            <article className="modal-content rounded-4 shadow">
              <form onSubmit={handleCambiarPassword} noValidate>
                <article className="modal-header bg-primary text-light">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-shield-lock me-2"></i>
                    Cambiar contraseña
                  </h5>
                </article>

                <article className="modal-body">
                  {/* Contraseña actual */}
                  <article className="mb-3">
                    <label className="form-label fw-semibold">
                      Contraseña actual
                    </label>

                    <article className="input-group">
                      <input
                        type={passwordVisible === 'current' ? 'text' : 'password'}
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordValidada(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setErrorPassword(null);
                        }}
                        placeholder="Introduce tu contraseña actual"
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        className="btn bg-primary text-light"
                        aria-label={
                          passwordVisible === 'current'
                            ? 'Ocultar contraseña actual'
                            : 'Mostrar contraseña actual'
                        }
                        onClick={() =>
                          setPasswordVisible(
                            passwordVisible === 'current' ? null : 'current'
                          )
                        }
                      >
                        <i
                          className={`bi ${
                            passwordVisible === 'current'
                              ? 'bi-eye-slash'
                              : 'bi-eye'
                          }`}
                        ></i>
                      </button>
                    </article>
                  </article>

                  {passwordValidada && (
                    <>
                      <article className="alert alert-success py-2">
                        <i className="bi bi-check-circle me-2"></i>
                        Contraseña actual verificada.
                      </article>

                      {/* Nueva contraseña */}
                      <article className="mb-3">
                        <label className="form-label fw-semibold">
                          Nueva contraseña
                        </label>

                        <article className="input-group">
                          <input
                            type={passwordVisible === 'new' ? 'text' : 'password'}
                            className="form-control"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Introduce tu nueva contraseña"
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            className="btn bg-primary text-light"
                            aria-label={
                              passwordVisible === 'new'
                                ? 'Ocultar nueva contraseña'
                                : 'Mostrar nueva contraseña'
                            }
                            onClick={() =>
                              setPasswordVisible(
                                passwordVisible === 'new' ? null : 'new'
                              )
                            }
                          >
                            <i
                              className={`bi ${
                                passwordVisible === 'new'
                                  ? 'bi-eye-slash'
                                  : 'bi-eye'
                              }`}
                            ></i>
                          </button>
                        </article>

                        <small className="text-secondary">
                          Debe tener al menos 8 caracteres.
                        </small>
                      </article>

                      {/* Confirmar nueva contraseña */}
                      <article className="mb-3">
                        <label className="form-label fw-semibold">
                          Confirmar nueva contraseña
                        </label>

                        <article className="input-group">
                          <input
                            type={passwordVisible === 'confirm' ? 'text' : 'password'}
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirma tu nueva contraseña"
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            className="btn bg-primary text-light"
                            aria-label={
                              passwordVisible === 'confirm'
                                ? 'Ocultar confirmación'
                                : 'Mostrar confirmación'
                            }
                            onClick={() =>
                              setPasswordVisible(
                                passwordVisible === 'confirm' ? null : 'confirm'
                              )
                            }
                          >
                            <i
                              className={`bi ${
                                passwordVisible === 'confirm'
                                  ? 'bi-eye-slash'
                                  : 'bi-eye'
                              }`}
                            ></i>
                          </button>
                        </article>
                      </article>
                    </>
                  )}

                  {errorPassword && (
                    <article className="alert alert-danger py-2 mb-0" role="alert">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {errorPassword}
                    </article>
                  )}
                </article>

                <article className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cerrarModalPassword}
                    disabled={cambiandoPassword}
                  >
                    Cancelar
                  </button>

                  {!passwordValidada ? (
                    <button
                      type="button"
                      className="btn text-white"
                      style={{ backgroundColor: 'var(--ar-profundo)' }}
                      onClick={handleValidarPassword}
                      disabled={cambiandoPassword}
                    >
                      {cambiandoPassword ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Validando...
                        </>
                      ) : (
                        'Validar contraseña'
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ backgroundColor: 'var(--ar-profundo)' }}
                      disabled={cambiandoPassword}
                    >
                      {cambiandoPassword ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </article>
              </form>
            </article>
          </article>
        </article>
      )}

      <Toast toast={toast} onCerrar={cerrarToast}/>
      
    </>
  );
}

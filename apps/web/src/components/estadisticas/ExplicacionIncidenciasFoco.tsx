export default function ExplicacionIncidenciasFoco() {
  return (
    <aside
      className="alert mb-0 small"
      style={{
        backgroundColor: 'var(--seige-superficie)',
        borderColor: 'var(--seige-borde)',
        color: 'var(--seige-texto-secundario)',
      }}
    >
      <strong style={{ color: 'var(--seige-texto)' }}>
        ¿Qué significa “incidencias de foco”?
      </strong>{' '}
      Es el número de veces que el alumno dejó la pantalla del quiz, por
      ejemplo, al cambiar de pestaña, ventana o aplicación. El “índice de foco
      limpio” muestra el porcentaje de intentos que terminaron sin incidencias.
      Estas métricas ayudan a identificar revisiones necesarias, pero una
      incidencia no demuestra por sí sola que hubo conducta indebida.
    </aside>
  );
}

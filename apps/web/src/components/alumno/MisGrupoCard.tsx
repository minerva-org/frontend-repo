import type { MisGrupoCardProps } from '../../types/AlumnoTypes.ts';

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export default function MisGrupoCard({
  id,
  materia,
  grupo,
  docente,
  activos,
  proximos,
  pasados,
  onClick,
}: MisGrupoCardProps) {
  return (
    <button type="button" className="mg-card" onClick={() => onClick(id)}>
      <h2 className="mg-card-title">{materia}</h2>
      <p className="mg-card-meta">{grupo} · {docente}</p>
      <article className="mg-pills">
        {activos > 0 && (
          <span className="mg-pill mg-pill-activo">
            <i className="bi bi-circle-fill"></i> {plural(activos, 'activo', 'activos')}
          </span>
        )}
        {proximos > 0 && (
          <span className="mg-pill mg-pill-proximo">{plural(proximos, 'próximo', 'próximos')}</span>
        )}
        {pasados > 0 && (
          <span className="mg-pill mg-pill-pasado">{plural(pasados, 'pasado', 'pasados')}</span>
        )}
      </article>
    </button>
  );
}
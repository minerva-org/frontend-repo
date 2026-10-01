import { useState, type FormEvent } from 'react';

const REGEX_INSTITUCIONAL = /^[^\s@]+@chapala\.edu\.mx$/i;

interface EmailChip {
  correo: string;
  valido: boolean;
}

interface AgregarAlumnosFormProps {
  onSubmit: (correos: string[]) => void;
  onCancel?: () => void;
  submitLabel?: string;
  title?: string;
}

function extraerCorreos(texto: string): string[] {
  return texto
    .split(/[,@\s\n]+/)
    .map((correo) => correo.trim())
    .filter(Boolean);
}

export default function AgregarAlumnosForm({
  onSubmit,
  onCancel,
  submitLabel = 'Enviar invitaciones',
  title = 'Agregar alumnos',
}: AgregarAlumnosFormProps) {
  const [textarea, setTextarea] = useState('');
  const [chips, setChips] = useState<EmailChip[]>([]);
  const [error, setError] = useState<string | null>(null);

  function procesarTexto(valor: string) {
    setTextarea(valor);

    const correos = extraerCorreos(valor);
    const vistos = new Set<string>();
    const nuevosChips: EmailChip[] = [];

    for (const correo of correos) {
      const normalizado = correo.toLowerCase();
      if (vistos.has(normalizado)) continue;
      vistos.add(normalizado);
      nuevosChips.push({
        correo,
        valido: REGEX_INSTITUCIONAL.test(correo),
      });
    }

    setChips(nuevosChips);
  }

  function eliminarChip(correo: string) {
    setChips((prev) => prev.filter((chip) => chip.correo !== correo));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (chips.length === 0) {
      setError('Agrega al menos un correo.');
      return;
    }

    const invalidos = chips.filter((chip) => !chip.valido);
    if (invalidos.length > 0) {
      setError(`${invalidos.length} correo(s) no son institucionales (@chapala.edu.mx) y deben corregirse o eliminarse.`);
      return;
    }

    onSubmit(chips.map((chip) => chip.correo));
    setTextarea('');
    setChips([]);
  }

  const validos = chips.filter((chip) => chip.valido).length;
  const invalidos = chips.length - validos;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        <span>{title}</span>
        <textarea
          placeholder="Pega o escribe los correos separados por coma, espacio o salto de línea. Ej: ana@chapala.edu.mx, carlos@chapala.edu.mx"
          value={textarea}
          onChange={(event) => procesarTexto(event.target.value)}
          rows={4}
        />
      </label>

      {chips.length > 0 && (
        <>
          <p>
            {chips.length} correo{chips.length !== 1 ? 's' : ''} detectado{chips.length !== 1 ? 's' : ''}
            {invalidos > 0 && (
              <span> · {invalidos} inválido{invalidos !== 1 ? 's' : ''}</span>
            )}
          </p>

          <article>
            {chips.map((chip) => (
              <span
                className={chip.valido ? '' : 'invalido'}
                key={chip.correo}
                title={chip.valido ? undefined : 'No es un correo institucional válido'}
              >
                {!chip.valido && <i className="bi bi-exclamation-triangle-fill"></i>}
                {chip.correo}
                <i className="bi bi-x" onClick={() => eliminarChip(chip.correo)}></i>
              </span>
            ))}
          </article>
        </>
      )}

      {error && <p>{error}</p>}

      <article>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit">{submitLabel}</button>
      </article>
    </form>
  );
}

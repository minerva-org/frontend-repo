import { useState, type SubmitEvent } from 'react';

const REGEX_INSTITUCIONAL = /^[^\s@]+@chapala\.edu\.mx$/i;

interface Email {
  correo: string;
  valido: boolean;
}

interface ModalAgregarAlumnosProps {
  onClose: () => void;
  onEnviar: (correos: string[]) => void;
}

function extraerCorreos(texto: string): string[] {
  return texto
    .split(/[,\s\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export default function ModalAgregarAlumnos({ onClose, onEnviar }: ModalAgregarAlumnosProps) {
  const [textarea, setTextarea] = useState('');
  const [chips, setChips] = useState<Email[]>([]);
  const [error, setError] = useState<string | null>(null);

  function procesarTexto(valor: string) {
    setTextarea(valor);

    const correos = extraerCorreos(valor);
    const vistos = new Set<string>();
    const nuevosChips: Email[] = [];

    for (const correo of correos) {
      const normalizado = correo.toLowerCase();
      if (vistos.has(normalizado)) continue;
      vistos.add(normalizado);
      nuevosChips.push({ correo, valido: REGEX_INSTITUCIONAL.test(correo) });
    }

    setChips(nuevosChips);
  }

  function eliminarChip(correo: string) {
    setChips((prev) => prev.filter((c) => c.correo !== correo));
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);

    if (chips.length === 0) {
      setError('Agrega al menos un correo.');
      return;
    }

    const invalidos = chips.filter((c) => !c.valido);
    if (invalidos.length > 0) {
      setError(`${invalidos.length} correo(s) no son institucionales (@chapala.edu.mx) y deben corregirse o eliminarse.`);
      return;
    }

    console.log('Invitaciones enviadas (mock):', chips.map((c) => c.correo));

    onEnviar(chips.map((c) => c.correo));
    onClose();
  }

  const validos = chips.filter((c) => c.valido).length;
  const invalidos = chips.length - validos;

  return (
    <article>
      <article>
        <article>
          <h2>Agregar alumnos</h2>
          <i className="bi bi-x-lg" onClick={onClose}></i>
        </article>

        <form onSubmit={handleSubmit} noValidate>
          <label>
            <span>Correos institucionales</span>
            <textarea
              placeholder="Pega o escribe los correos separados por coma, espacio o salto de línea. Ej: ana@chapala.edu.mx, carlos@chapala.edu.mx"
              value={textarea}
              onChange={(e) => procesarTexto(e.target.value)}
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
                    className={`${chip.valido ? '' : 'invalido'}`}
                    key={chip.correo}
                    title={chip.valido ? undefined : 'No es un correo institucional válido'}
                  >
                    {!chip.valido && <i className="bi bi-exclamation-triangle-fill"></i>}
                    {chip.correo}
                    <i
                      className="bi bi-x"
                      onClick={() => eliminarChip(chip.correo)}
                    ></i>
                  </span>
                ))}
              </article>
            </>
          )}

          {error && <p>{error}</p>}

          <article>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">
              Enviar invitaciones
            </button>
          </article>
        </form>
      </article>
    </article>
  );
}
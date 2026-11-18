import { useEffect, useState, type FormEvent } from 'react';
import {
  getExtractionPrompts,
  laboratoryErrorMessage,
  runExtraction,
  type DocumentLabResponse,
  type ExtractionPrompts,
  type PromptDefaults,
  type SourceType,
} from '../services/agenteLaboratorioService';
import '../styles/LaboratorioAgente.css';

const layers: Array<{ key: keyof ExtractionPrompts; title: string }> = [
  { key: 'role', title: '1. Rol y reglas' },
  { key: 'instructions', title: '2. Instrucciones de extraccion' },
  { key: 'outputContract', title: '3. Estructura JSON y ejemplo de salida' },
];

export default function LaboratorioAgente() {
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null);
  const [prompts, setPrompts] = useState<ExtractionPrompts>({
    role: '', instructions: '', outputContract: '',
  });
  const [sourceType, setSourceType] = useState<SourceType>('STUDY_PLAN');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentLabResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getExtractionPrompts(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDefaults(data);
        setPrompts(data.prompts);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(laboratoryErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadVersion]);

  async function execute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!file || !defaults) {
      setError('Selecciona un PDF y espera a que se carguen los prompts.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size === 0) {
      setError('Selecciona un archivo PDF no vacio.');
      return;
    }
    const maxBytes = Math.min(defaults.maxPdfBytes, 10 * 1024 * 1024);
    if (file.size > maxBytes) {
      setError(`El PDF no puede superar ${maxBytes / 1024 / 1024} MiB.`);
      return;
    }
    setRunning(true);
    try {
      setResult(await runExtraction(file, sourceType, prompts));
    } catch (cause) {
      setError(laboratoryErrorMessage(cause));
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className="agent-lab">
      <header>
        <h1>Laboratorio de pruebas de agente</h1>
        <p>Solo DEV. Las pruebas no guardan materias ni modifican los prompts predeterminados.</p>
      </header>

      <div className="agent-lab-modes" role="group" aria-label="Modo del laboratorio">
        <button type="button" className="btn btn-primary" aria-pressed="true">
          Extraccion de documento para materia
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled>
          Generacion de quiz (proximamente)
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled>
          Analisis estadistico (proximamente)
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading && <p role="status">Cargando prompts desde AI-Service...</p>}
      {!loading && !defaults && (
        <button type="button" className="btn btn-outline-primary" onClick={() => {
          setError('');
          setLoading(true);
          setLoadVersion((value) => value + 1);
        }}>Reintentar carga</button>
      )}

      <div className="agent-lab-columns">
        <form onSubmit={execute}>
          <fieldset disabled={loading || running || !defaults}>
            <legend>Extraccion de material didactico</legend>
            <label htmlFor="lab-source">Tipo de fuente</label>
            <select id="lab-source" className="form-select" value={sourceType}
              onChange={(event) => {
                if (event.target.value === 'STUDY_PLAN' || event.target.value === 'SOURCE_MATERIAL') {
                  setSourceType(event.target.value);
                }
              }}>
              <option value="STUDY_PLAN">Plan de estudio</option>
              <option value="SOURCE_MATERIAL">Material fuente</option>
            </select>
            <p className="agent-lab-help">
              El plan conserva la jerarquia explicita. El material fuente permite organizar
              el contenido didactico sin agregar conocimientos externos.
            </p>

            {layers.map(({ key, title }) => (
              <div className="agent-lab-layer" key={key}>
                <label htmlFor={`lab-${key}`}>{title}</label>
                <textarea id={`lab-${key}`} className="form-control" rows={6}
                  required maxLength={12000} value={prompts[key]}
                  onChange={(event) => setPrompts((current) => ({
                    ...current, [key]: event.target.value,
                  }))} />
              </div>
            ))}

            <p className="agent-lab-help">
              El esquema units / topics / concepts es fijo en esta version.
              Se permite units vacio si no hay contenido identificable.
              El texto del PDF se adjunta aparte de las tres capas.
            </p>
            <label htmlFor="lab-file">PDF con texto seleccionable (hasta 10 MiB, sin OCR)</label>
            <input id="lab-file" type="file" className="form-control" accept=".pdf,application/pdf"
              required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <div className="agent-lab-actions">
              <button type="submit" className="btn btn-primary">
                {running ? 'Ejecutando...' : 'Ejecutar prueba'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => {
                if (defaults) setPrompts(defaults.prompts);
              }}>Restaurar prompts</button>
            </div>
          </fieldset>
        </form>

        <section className="agent-lab-output" aria-labelledby="lab-output-title" aria-busy={running}>
          <h2 id="lab-output-title">Respuesta de AI-Service</h2>
          {defaults && <p>Modelo configurado: <strong>{defaults.model}</strong></p>}
          {running && <p role="status">Procesando el documento. La prueba puede tardar varios minutos.</p>}
          {!running && !result && <p>Aqui aparecera la respuesta de la prueba.</p>}
          {result && (
            <>
              <p>Modelo: <strong>{result.model}</strong> | Duracion: {(result.durationMs / 1000).toFixed(2)} s</p>
              {result.validationErrors.length > 0 ? (
                <div className="alert alert-warning" role="alert">
                  <strong>Salida no valida. No se genero un arbol utilizable.</strong>
                  <ul>{result.validationErrors.map((message, index) => <li key={index}>{message}</li>)}</ul>
                </div>
              ) : (
                <div className="alert alert-success" role="status">
                  JSON valido y estructura correcta. Esto no garantiza fidelidad al documento.
                </div>
              )}
              {result.tree && (
                <>
                  <h3>Arbol extraido</h3>
                  {result.tree.units.length === 0 && <p>Sin estructura didactica identificable.</p>}
                  {result.tree.units.map((unit, index) => (
                    <details key={index} open>
                      <summary>{unit.name}</summary>
                      {unit.topics.map((topic, topicIndex) => (
                        <details key={topicIndex} open>
                          <summary>{topic.name}</summary>
                          <ul>{topic.concepts.map((concept, conceptIndex) => (
                            <li key={conceptIndex}>{concept.name}</li>
                          ))}</ul>
                        </details>
                      ))}
                    </details>
                  ))}
                  <h3>JSON validado</h3>
                  <pre>{JSON.stringify(result.tree, null, 2)}</pre>
                </>
              )}
              <details open={result.validationErrors.length > 0}>
                <summary>Salida original del modelo</summary>
                <pre>{result.rawOutput}</pre>
              </details>
            </>
          )}
        </section>
      </div>
    </article>
  );
}

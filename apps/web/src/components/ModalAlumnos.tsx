import { createPortal } from 'react-dom';
import AgregarAlumnosForm from './grupos/AgregarAlumnosForm.tsx';

interface ModalAgregarAlumnosProps {
  onClose: () => void;
  onEnviar: (correos: string[]) => void;
}

export default function ModalAgregarAlumnos({ onClose, onEnviar }: ModalAgregarAlumnosProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <article
        style={{
          width: 'min(700px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: '18px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)',
          padding: '1.5rem',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <article style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Agregar alumnos</h2>
          <i className="bi bi-x-lg" onClick={onClose} style={{ cursor: 'pointer' }}></i>
        </article>

        <AgregarAlumnosForm
          onSubmit={(correos) => {
            onEnviar(correos);
            onClose();
          }}
          onCancel={onClose}
        />
      </article>
    </div>,
    document.body,
  );
}
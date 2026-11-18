import type { PaginacionProps } from "../../types/PaginacionTypes";

export function Paginacion({
    paginaActual,
    totalPaginas,
    totalItems,
    itemsPorPagina,
    onPageChange,
    nombreItems = 'registros',
}: PaginacionProps){
    if (totalItems === 0 )return null;

    const primerItem = (paginaActual - 1) * itemsPorPagina +1;
    const ultimoItem = Math.min( paginaActual * itemsPorPagina,totalItems);

    return (
        <article className="d-flex justify-content-between align-ites-center mt-3 flex-wrap gap-2">
            <span className="text-muted small">Mostrando {primerItem} -{ultimoItem} de {totalItems} {nombreItems} </span>
        
            <article className="d-flex align-items-center gap-2">
                <button 
                disabled={paginaActual === 1}
                className="btn btn-primary btn-sm"
                onClick={() => onPageChange(paginaActual-1)} >
                    <i className="bi bi-chevron-left"></i>
                </button>

                <span className="badge bg-primary">{paginaActual} / {totalPaginas}</span>

                <button
                disabled={paginaActual === totalPaginas}
                className="btn btn-primary btn-sm"
                onClick={() => onPageChange(paginaActual +1)}>
                    <i className="bi bi-chevron-right"></i>
                </button>
            </article>
        </article>
    )
}
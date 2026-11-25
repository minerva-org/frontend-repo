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
        <article
            className="d-flex justify-content-between align-items-center mt-3 ps-3 pt-3 pb-3 border-top flex-wrap gap-2 text-secondary pe-3"
        >
            <span className="small">Mostrando {primerItem} - {ultimoItem} de {totalItems} {nombreItems} </span>
        
            <article className="d-flex align-items-center gap-2 ">
                <button 
                disabled={paginaActual === 1}
                className="btn btn-sm text-primary border border-primary-subtle bg-primary-subtle"
                onClick={() => onPageChange(paginaActual-1)} >
                    <i className="bi bi-chevron-left"></i>
                </button>

                <span className="badge bg-primary-subtle opacity-75 text-primary fs-6  ">
                    {paginaActual} / {totalPaginas}
                </span>

                <button
                disabled={paginaActual === totalPaginas}
                className="btn btn-sm text-primary border border-primary-subtle bg-primary-subtle"
                onClick={() => onPageChange(paginaActual +1)}>
                    <i className="bi bi-chevron-right"></i>
                </button>
            </article>
        </article>
    )
}
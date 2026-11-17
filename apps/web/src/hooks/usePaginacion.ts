import { useCallback } from "react";
import type { UsePaginationProps, UsePaginacionReturn } from "../types/PaginacionTypes";

export function usePaginacion({
    paginaActual,
    totalPaginas,
    onPageChange,
}: UsePaginationProps): UsePaginacionReturn{

    const irAPagina = useCallback((page: number) => {
            const paginaValida= Math.min(Math.max(page,1),Math.max(totalPaginas,1),);
            onPageChange(paginaValida);
        }, [totalPaginas,onPageChange],);

    const siguientePagina = useCallback(() => {
        irAPagina(paginaActual + 1);
    }, [paginaActual,irAPagina]); 

    const anteriorPagina = useCallback(() => {
        irAPagina(paginaActual - 1);
    }, [paginaActual,irAPagina]); 

    return {
        paginaActual,
        totalPaginas,
        irAPagina,
        siguientePagina,
        anteriorPagina,
        tieneSiguientePagina:paginaActual < totalPaginas,
        tieneAnteriorPagina: paginaActual > 1,
    };
}
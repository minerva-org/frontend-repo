import {useEffect, useMemo, useState, useCallback} from 'react';
import type { UsePaginationProps, UsePaginacionReturn } from '../types/PaginacionTypes';

export function usePaginacion<T>({ data, itemsPorPagina = 10}: UsePaginationProps<T>): UsePaginacionReturn<T>{
    const [paginaActual, setPaginaActual] = useState(1);

    const totalPaginas = Math.ceil(data.length / itemsPorPagina);

    useEffect(()=> {
      setPaginaActual((actual)=>
        Math.min(actual, Math.max(totalPaginas,1)));
    }, [totalPaginas]);

    const dataPaginada = useMemo(() => {
        const index = (paginaActual - 1) * itemsPorPagina;

        return data.slice(index, index + itemsPorPagina);
    }, [data,paginaActual,itemsPorPagina]);

    const irAPagina = useCallback(
        (page: number) => {
        setPaginaActual(Math.min(Math.max(page,1),Math.max(totalPaginas,1)));
    },[totalPaginas]);

    const siguientePagina = useCallback(()=>{
        irAPagina(paginaActual + 1);
    }, [paginaActual,irAPagina]);

    const anteriorPagina = useCallback(()=>{
        irAPagina(paginaActual - 1);
    }, [paginaActual,irAPagina]);

    return {
        paginaActual,
        totalPaginas,
        dataPaginada,
        irAPagina,
        siguientePagina,
        anteriorPagina,
        setPaginaActual,
        tieneSiguientePagina: paginaActual < totalPaginas,
        tieneAnteriorPagina: paginaActual > 1,
    };
}
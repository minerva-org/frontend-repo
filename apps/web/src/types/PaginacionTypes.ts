export interface UsePaginationProps<T>{
    data: T[];
    itemsPorPagina?: number;
}

export interface PaginacionProps {
    paginaActual: number;
    totalPaginas: number;
    totalItems: number;
    itemsPorPagina: number;
    onPageChange: (page: number) => void;
}

export interface UsePaginacionReturn<T>{
    paginaActual:number;
    totalPaginas: number;
    dataPaginada: T[];
    irAPagina: (page: number) => void;
    siguientePagina: () => void;
    anteriorPagina: () => void;
    setPaginaActual: (page: number) => void;
    tieneSiguientePagina: boolean;
    tieneAnteriorPagina: boolean;
}
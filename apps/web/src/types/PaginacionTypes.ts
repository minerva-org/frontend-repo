export type UsePaginationProps = Pick<
    PaginacionProps,
    'paginaActual' | 'totalPaginas' | 'onPageChange'
>;

export interface PaginacionProps {
    paginaActual: number;
    totalPaginas: number;
    totalItems: number;
    itemsPorPagina: number;
    onPageChange: (page: number) => void;
    nombreItems?:string;
}

export interface UsePaginacionReturn{
    paginaActual:number;
    totalPaginas: number;
    irAPagina: (page: number) => void;
    siguientePagina: () => void;
    anteriorPagina: () => void;
    tieneSiguientePagina: boolean;
    tieneAnteriorPagina: boolean;
}

export interface PaginaResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
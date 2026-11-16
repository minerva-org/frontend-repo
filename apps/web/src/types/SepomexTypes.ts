export interface SepomexColonia{
    id:number;
    d_codigo: string;
    d_asenta: string; //asenta = asentamiento =  colonia... me saco de onda SEPOMEX ahi XD
    d_tipo_adenta:string;
    d_mnpio: string;
    d_estado: string;
}

export interface SepomexResponse {
    zip_codes: SepomexColonia[]; 
}
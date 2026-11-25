import type { SepomexColonia, SepomexResponse } from "../types/SepomexTypes";

export async function buscarCP(cp:string): Promise<SepomexColonia[]> {
    const response = await fetch(`https://sepomex.kurenn.dev/api/v1/zip_codes?zip_code=${cp}`);
    
    if(!response.ok){
        throw new Error('No se encontró el código Postal');
    }

    const data: SepomexResponse = await response.json();

    return data.zip_codes;
}
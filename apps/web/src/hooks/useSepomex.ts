import { buscarCP } from '../services/sepomexService.ts';
import { type SepomexColonia } from '../types//SepomexTypes.ts'
import{useState} from 'react';

export function useSepomex(){
    const [colonias,setColonias] = useState<SepomexColonia[]>([]);
    const [buscandoCP,setBuscandoCP] = useState(false);
    const [errorCP,setErrorCP] = useState('');

      const consultarCP = async (cp:string) =>{
        if(!/^\d{5}$/.test(cp)){
            setErrorCP('Ingresa un código postal de 5 digitos');
            return null;
        }

        try{
            setBuscandoCP(true);
            setErrorCP('');
    
            const resultados = await buscarCP(cp);
        
            if (resultados.length === 0){
                throw new Error('Código postal no encontrado');
            }
        
            setColonias(resultados);
            return resultados;
            } catch (error){
                setColonias([]);
                setErrorCP(error instanceof Error ? error.message :'Error al consultar el código Postal');
                return null;
            } finally {
                setBuscandoCP(false)
        }
    };

    const limpiarCP= () => {
        setColonias([]);
        setErrorCP('');
    };

    return{
        colonias,
        buscandoCP,
        errorCP,
        consultarCP,
        limpiarCP,
    };
}
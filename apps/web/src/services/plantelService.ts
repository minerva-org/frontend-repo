import {apiClient } from './ApiClient'
import type { PlantelRecord } from '../types/PlantelTypes'

export const fetchPlantelById = (id:number) =>{
    return apiClient.get<PlantelRecord>(`/api/planteles/${id}`);
}
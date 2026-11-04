import {supabase} from './api';
import {validateWorkshops,type Workshop,type WorkshopAssignment,type WorkshopScope} from './workshopAllocation';
export async function saveWorkshopAllocation(stageId:string,workshops:Workshop[],assignments:WorkshopAssignment[],scope:WorkshopScope){validateWorkshops(workshops);const {error}=await supabase.rpc('assign_training_workshops',{p_stage_id:stageId,p_workshops:workshops.map(w=>({...w,name:w.name.trim()})),p_assignments:assignments,p_scope:scope});if(error)throw error}

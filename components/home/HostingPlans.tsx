// Servidor (build): obtiene los planes de WHMCS y los pasa al selector.
import { getPlans, PLAN_IDS } from '@/lib/whmcs';
import { PlanPicker } from './PlanPicker';

export async function HostingPlans() {
  const [web, vps] = await Promise.all([getPlans(PLAN_IDS.web), getPlans(PLAN_IDS.vps)]);
  return <PlanPicker plans={{ web, vps }} />;
}

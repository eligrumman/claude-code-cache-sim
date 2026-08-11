import type { Model } from "../engine/types.js";
import { MACRO_ROUTES, priceTaskChoice, verdictForChoice, type Effort, type RouteVerdict } from "../article/macroPricing.js";

export type Difficulty = "easy" | "medium" | "hard";
export type Phase = "briefing" | "setup" | "running" | "report" | "won" | "lost";
export type ConfigId = "stablePrefix" | "lazyTools" | "compact" | "keepWarm" | "ttl" | "backpacks";
export type Assignment = { model: Model; effort: Effort };
export type TaskType = { name: string; routeIndex: number; unlock: number; icon: string };
export type CampaignTask = TaskType & { id: string; day: number };
export type TaskResult = CampaignTask & { assignment: Assignment; verdict: RouteVerdict; cost: number; baseline: number; passed: boolean };
export type WeekReport = { week: number; results: TaskResult[]; spent: number; baseline: number; saved: number; successRate: number; required: number; budget: number; securityDelta: number };
export type CampaignState = { week: number; phase: Phase; security: number; assignments: Record<string, Assignment>; subagents: boolean | null; configs: ConfigId[]; reports: WeekReport[]; totalSaved: number; endless: boolean };

export const MODELS: readonly Model[] = ["haiku", "sonnet", "opus", "fable"];
export const EFFORTS: readonly Effort[] = ["low", "medium", "high"];
export const TASK_TYPES: readonly TaskType[] = [
  { name:"Development", routeIndex:0, unlock:1, icon:"🛠" }, { name:"QA", routeIndex:4, unlock:2, icon:"🔎" },
  { name:"Production Bug", routeIndex:1, unlock:2, icon:"🚨" }, { name:"Design", routeIndex:0, unlock:3, icon:"✏️" },
  { name:"Refactor / Config", routeIndex:5, unlock:3, icon:"🧹" }, { name:"RCA", routeIndex:3, unlock:4, icon:"🧾" },
  { name:"Docs", routeIndex:6, unlock:4, icon:"📚" }, { name:"Debugging", routeIndex:2, unlock:5, icon:"🪲" },
  { name:"Tests", routeIndex:5, unlock:5, icon:"🧪" },
];
export const CONFIGS: Record<ConfigId,{name:string; effect:string; discount:number}> = {
  stablePrefix:{name:"Stable shared prefix",effect:"input −18%",discount:.18}, lazyTools:{name:"Lazy-load skills + MCP",effect:"input −14%",discount:.14},
  compact:{name:"Auto-compact",effect:"input −10%",discount:.10}, keepWarm:{name:"Keep-warm ping",effect:"cache shocks/decay −60%",discount:.06},
  ttl:{name:"1-hour cache TTL",effect:"long-gap reads stay 0.1×",discount:.07}, backpacks:{name:"Smaller subagent backpacks",effect:"subagent input reduction",discount:.08},
};
export const CONFIG_UNLOCKS: readonly ConfigId[] = ["stablePrefix","lazyTools","compact","keepWarm","ttl","backpacks"];
const SETTINGS = {
  easy:{ required:[20,30,48,60,72,80], budget:1.32, volume:.85, damage:.65 },
  medium:{ required:[25,38,55,68,80,88], budget:1.12, volume:1, damage:1 },
  hard:{ required:[35,48,65,78,88,94], budget:.96, volume:1.18, damage:1.25 },
} as const;

export function newCampaign(): CampaignState { return {week:1,phase:"briefing",security:100,assignments:{},subagents:null,configs:[],reports:[],totalSaved:0,endless:false}; }
export function typesForWeek(week:number): TaskType[] { return TASK_TYPES.filter(t=>t.unlock<=Math.min(week,6)); }
export function newlyUnlocked(week:number): TaskType[] { return TASK_TYPES.filter(t=>t.unlock===week); }
export function assignmentFor(state:CampaignState,typeName:string): Assignment | undefined { return state.subagents===false ? state.assignments.Development : state.assignments[typeName] ?? state.assignments.Development; }
export function configMultiplier(configs:readonly ConfigId[]):number { return configs.reduce((n,id)=>n*(1-CONFIGS[id].discount),1); }
export function previewChoice(type:TaskType, assignment:Assignment, configs:readonly ConfigId[]=[]){ const route=MACRO_ROUTES[type.routeIndex]; return {verdict:verdictForChoice(route,assignment.model,assignment.effort),cost:priceTaskChoice(route,assignment.model,assignment.effort)*configMultiplier(configs),baseline:priceTaskChoice(route,"opus","high")}; }
export function weekTasks(week:number,difficulty:Difficulty):CampaignTask[]{
  const types=typesForWeek(week); const base=week>=6?18:4+week*2; const count=Math.max(types.length,Math.round(base*SETTINGS[difficulty].volume));
  return Array.from({length:count},(_,i)=>({...types[(i*3+week)%types.length],id:`w${week}-t${i+1}`,day:i%5+1}));
}
export function requiredRate(week:number,difficulty:Difficulty):number { const bars=SETTINGS[difficulty].required; return bars[Math.min(week,6)-1] ?? Math.min(98,bars[5]+(week-6)*2); }
export function resolveWeek(state:CampaignState,difficulty:Difficulty,tasks=weekTasks(state.week,difficulty),practice=false):{state:CampaignState;report:WeekReport}{
  const multiplier=configMultiplier(state.configs); const results=tasks.map(task=>{const assignment=assignmentFor(state,task.name)??{model:"haiku" as Model,effort:"low" as Effort};const route=MACRO_ROUTES[task.routeIndex];const verdict=verdictForChoice(route,assignment.model,assignment.effort);const baseline=priceTaskChoice(route,"opus","high");return {...task,assignment,verdict,cost:priceTaskChoice(route,assignment.model,assignment.effort)*multiplier,baseline,passed:verdict!=="bad"};});
  const spent=results.reduce((n,r)=>n+r.cost,0), baseline=results.reduce((n,r)=>n+r.baseline,0), successRate=results.length?results.filter(r=>r.passed).length/results.length*100:100, required=requiredRate(state.week,difficulty), budget=baseline*SETTINGS[difficulty].budget*.58;
  const over=spent>budget; let securityDelta=successRate<required?-Math.ceil((required-successRate)*.55*SETTINGS[difficulty].damage):over?0:successRate>=required+10?8:3; if(state.week<=2)securityDelta=Math.max(securityDelta,-18);
  const security=practice?Math.max(1,state.security+Math.max(0,securityDelta)):Math.max(0,Math.min(100,state.security+securityDelta)); const report={week:state.week,results,spent,baseline,saved:baseline-spent,successRate,required,budget,securityDelta};
  return {report,state:{...state,phase:security<=0&&!practice?"lost":"report",security,reports:[...state.reports,report],totalSaved:state.totalSaved+report.saved}};
}
export function advanceWeek(state:CampaignState):CampaignState { if(state.week>=6&&!state.endless)return {...state,phase:"won"}; return {...state,week:state.week+1,phase:"briefing"}; }
export function enterEndless(state:CampaignState):CampaignState { return {...state,endless:true,week:7,phase:"briefing",configs:Object.keys(CONFIGS) as ConfigId[]}; }

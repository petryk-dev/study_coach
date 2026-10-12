import { api } from './client';
import { PlanTask, TodayPlan } from './types';

export const getTodayPlan = async () => (await api.get<TodayPlan>('/plan/today')).data;

/** e.g. "Review · Cell Biology" */
export const getTaskLabel = (task: PlanTask) =>
  `${task.type === 'review' ? 'Review' : 'Quiz'} · ${task.deckTitle}`;

/** e.g. "4 / 12 cards" or "1 quiz" */
export const getTaskProgress = (task: PlanTask) =>
  task.type === 'review' ? `${Math.min(task.done, task.target)} / ${task.target} cards` : '1 quiz';

/** The first task that isn't finished yet, for "Continue session" */
export const getNextTask = (plan: TodayPlan) => plan.tasks.find((task) => !task.completed);

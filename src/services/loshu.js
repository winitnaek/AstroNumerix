import { api } from './api';

export function analyzeLoShuGrid(payload) {
  return api.loshu(payload);
}

import { MatchService } from './services/MatchService';

/**
 * Legacy wrapper that triggers the autoUpdateStatuses in MatchService.
 * This keeps backwards compatibility with existing views.
 */
export async function autoUpdateMatchStatuses() {
  await MatchService.autoUpdateStatuses();
}

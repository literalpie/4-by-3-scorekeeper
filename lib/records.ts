import { record, object, string, optional } from '@atproto/lex';

export const scoreRecord = record(
  'tid',
  'com.literalpie.gamescore',
  object({
    gameUrl: string(),
    score: string(),
    playedAt: string({ format: 'datetime' }),
    gameData: optional(object({})),
  }),
);

export const SCORE_RECORD_TYPE = scoreRecord.$type;

export interface ScoreRecord {
  gameUrl: string;
  score: string;
  playedAt: string;
  gameData?: Record<string, unknown>;
}

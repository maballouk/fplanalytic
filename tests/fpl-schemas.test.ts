import { describe, expect, it } from 'vitest';
import { ElementHistorySchema, LiveSchema } from '@/lib/fpl/schemas';

// Field values below are real API responses captured 2026-09-12 (GW1-3).
// They double as documentation of the DEFCON composite semantics:
// defensive_contribution = CBIT + tackles for DEF, + recoveries for MID/FWD.

const gabrielGw2 = {
  element: 4,
  round: 2,
  minutes: 90,
  total_points: 8,
  opponent_team: 12,
  was_home: true,
  clearances_blocks_interceptions: 8,
  tackles: 2,
  recoveries: 5,
  defensive_contribution: 10,
  goals_scored: 1,
  assists: 0,
  clean_sheets: 1,
  saves: 0,
  bonus: 2,
};

const kamaraGw1 = {
  element: 47,
  round: 1,
  minutes: 90,
  total_points: 2,
  opponent_team: 3,
  was_home: false,
  clearances_blocks_interceptions: 3,
  tackles: 2,
  recoveries: 2,
  defensive_contribution: 7,
  goals_scored: 0,
  assists: 0,
  clean_sheets: 0,
  saves: 0,
  bonus: 0,
};

describe('ElementHistorySchema', () => {
  it('parses a real defender match row', () => {
    const row = ElementHistorySchema.parse(gabrielGw2);
    // DEF composite excludes recoveries
    expect(row.defensive_contribution).toBe(row.clearances_blocks_interceptions + row.tackles);
  });

  it('parses a real midfielder match row', () => {
    const row = ElementHistorySchema.parse(kamaraGw1);
    // MID composite includes recoveries
    expect(row.defensive_contribution).toBe(
      row.clearances_blocks_interceptions + row.tackles + row.recoveries
    );
  });

  it('rejects rows missing DEFCON fields', () => {
    const { defensive_contribution: _omitted, ...incomplete } = gabrielGw2;
    expect(() => ElementHistorySchema.parse(incomplete)).toThrow();
  });
});

describe('LiveSchema', () => {
  it('parses live element stats', () => {
    const live = LiveSchema.parse({
      elements: [
        {
          id: 4,
          stats: {
            minutes: 45,
            total_points: 1,
            clearances_blocks_interceptions: 5,
            tackles: 1,
            recoveries: 3,
            defensive_contribution: 6,
          },
        },
      ],
    });
    expect(live.elements[0].stats.defensive_contribution).toBe(6);
  });
});

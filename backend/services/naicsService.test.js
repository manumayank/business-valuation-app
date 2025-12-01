/**
 * NAICS Service Tests
 */

const naicsService = require('./naicsService');

describe('NAICS Service', () => {
  beforeEach(() => {
    naicsService.clearCache();
  });

  describe('parseCSVLine', () => {
    it('parses simple CSV line', () => {
      const result = naicsService.parseCSVLine('111110 - Soybean Farming,111110,Soybean Farming');
      expect(result).toEqual(['111110 - Soybean Farming', '111110', 'Soybean Farming']);
    });

    it('handles quoted fields with commas', () => {
      const result = naicsService.parseCSVLine('"Soil Preparation, Planting",115112,Description');
      expect(result[0]).toBe('Soil Preparation, Planting');
    });
  });

  describe('getAllCodes', () => {
    it('returns array of NAICS codes', () => {
      const codes = naicsService.getAllCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    it('each code has required properties', () => {
      const codes = naicsService.getAllCodes();
      const first = codes[0];
      expect(first).toHaveProperty('code');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('sector');
      expect(first).toHaveProperty('subsector');
    });

    it('code is 6 digits', () => {
      const codes = naicsService.getAllCodes();
      codes.forEach(c => {
        expect(c.code).toMatch(/^\d{6}$/);
      });
    });
  });

  describe('getByCode', () => {
    it('finds code that exists', () => {
      const result = naicsService.getByCode('111110');
      expect(result).not.toBeNull();
      expect(result.code).toBe('111110');
      expect(result.title).toContain('Soybean');
    });

    it('returns null for non-existent code', () => {
      const result = naicsService.getByCode('999999');
      expect(result).toBeNull();
    });
  });

  describe('searchByTitle', () => {
    it('finds industries by partial title match', () => {
      const results = naicsService.searchByTitle('farming');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.title.toLowerCase()).toContain('farming');
      });
    });

    it('returns empty for too short query', () => {
      const results = naicsService.searchByTitle('a');
      expect(results).toEqual([]);
    });

    it('respects limit parameter', () => {
      const results = naicsService.searchByTitle('service', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('is case insensitive', () => {
      const lower = naicsService.searchByTitle('mining');
      const upper = naicsService.searchByTitle('MINING');
      expect(lower.length).toBe(upper.length);
    });
  });

  describe('getBySector', () => {
    it('returns industries for sector 11 (Agriculture)', () => {
      const results = naicsService.getBySector('11');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.sector).toBe('11');
      });
    });

    it('returns empty for non-existent sector', () => {
      const results = naicsService.getBySector('99');
      expect(results).toEqual([]);
    });
  });

  describe('getMultipleForCode', () => {
    it('returns sector multiple for valid code', () => {
      const result = naicsService.getMultipleForCode('111110');
      expect(result).toHaveProperty('min');
      expect(result).toHaveProperty('median');
      expect(result).toHaveProperty('max');
      expect(result).toHaveProperty('source');
      expect(result.sector).toBe('11');
    });

    it('returns default multiple for null code', () => {
      const result = naicsService.getMultipleForCode(null);
      expect(result.source).toBe('default');
    });

    it('returns correct sector name', () => {
      const result = naicsService.getMultipleForCode('541110');
      expect(result.name).toContain('Professional');
    });
  });

  describe('getSectorMultiples', () => {
    it('returns all sector multiples', () => {
      const multiples = naicsService.getSectorMultiples();
      expect(Object.keys(multiples).length).toBeGreaterThan(0);
    });

    it('each sector has min, median, max', () => {
      const multiples = naicsService.getSectorMultiples();
      Object.values(multiples).forEach(m => {
        expect(m.min).toBeLessThan(m.median);
        expect(m.median).toBeLessThan(m.max);
      });
    });
  });

  describe('getStats', () => {
    it('returns statistics about loaded codes', () => {
      const stats = naicsService.getStats();
      expect(stats).toHaveProperty('totalCodes');
      expect(stats).toHaveProperty('sectorCounts');
      expect(stats).toHaveProperty('sectorsWithMultiples');
      expect(stats.totalCodes).toBeGreaterThan(900);
    });
  });

  describe('SECTOR_MULTIPLES', () => {
    it('covers major sectors', () => {
      const sectors = naicsService.SECTOR_MULTIPLES;
      expect(sectors['11']).toBeDefined(); // Agriculture
      expect(sectors['23']).toBeDefined(); // Construction
      expect(sectors['44']).toBeDefined(); // Retail
      expect(sectors['54']).toBeDefined(); // Professional Services
      expect(sectors['72']).toBeDefined(); // Accommodation & Food
    });

    it('multiples are reasonable values', () => {
      const sectors = naicsService.SECTOR_MULTIPLES;
      Object.values(sectors).forEach(s => {
        expect(s.min).toBeGreaterThanOrEqual(1.5);
        expect(s.max).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('caching', () => {
    it('uses cache on second call', () => {
      const first = naicsService.getAllCodes();
      const second = naicsService.getAllCodes();
      expect(first).toBe(second); // Same reference
    });

    it('clearCache forces reload', () => {
      const first = naicsService.getAllCodes();
      naicsService.clearCache();
      const second = naicsService.getAllCodes();
      expect(first).not.toBe(second); // Different reference
      expect(first.length).toBe(second.length); // Same data
    });
  });
});

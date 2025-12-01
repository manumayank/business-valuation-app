/**
 * NAICS Industry Code Service
 * Provides industry lookup and default multiples by sector
 */

const fs = require('fs');
const path = require('path');

// Default multiples by major NAICS sector (2-digit code prefix)
// These are industry averages that can be overridden by admin
const SECTOR_MULTIPLES = {
  '11': { name: 'Agriculture, Forestry, Fishing', min: 2.0, median: 3.0, max: 4.5 },
  '21': { name: 'Mining, Quarrying, Oil & Gas', min: 3.0, median: 4.5, max: 6.0 },
  '22': { name: 'Utilities', min: 4.0, median: 6.0, max: 8.0 },
  '23': { name: 'Construction', min: 2.0, median: 3.5, max: 5.0 },
  '31': { name: 'Manufacturing (Food, Textile, Apparel)', min: 3.0, median: 4.5, max: 6.5 },
  '32': { name: 'Manufacturing (Wood, Paper, Chemical)', min: 3.0, median: 4.5, max: 6.5 },
  '33': { name: 'Manufacturing (Metal, Machinery, Electronics)', min: 3.5, median: 5.0, max: 7.0 },
  '42': { name: 'Wholesale Trade', min: 2.5, median: 4.0, max: 5.5 },
  '44': { name: 'Retail Trade', min: 2.0, median: 3.5, max: 5.0 },
  '45': { name: 'Retail Trade (Sporting, Hobby, General)', min: 2.0, median: 3.5, max: 5.0 },
  '48': { name: 'Transportation & Warehousing', min: 3.0, median: 4.5, max: 6.0 },
  '49': { name: 'Transportation & Warehousing (Postal, Courier)', min: 3.0, median: 4.5, max: 6.0 },
  '51': { name: 'Information (Publishing, Broadcasting, Telecom)', min: 4.0, median: 6.0, max: 10.0 },
  '52': { name: 'Finance & Insurance', min: 3.5, median: 5.5, max: 8.0 },
  '53': { name: 'Real Estate & Rental', min: 4.0, median: 6.0, max: 9.0 },
  '54': { name: 'Professional, Scientific & Technical Services', min: 3.5, median: 5.5, max: 8.0 },
  '55': { name: 'Management of Companies', min: 4.0, median: 6.0, max: 8.0 },
  '56': { name: 'Administrative & Support Services', min: 3.0, median: 4.5, max: 6.5 },
  '61': { name: 'Educational Services', min: 3.0, median: 4.5, max: 6.5 },
  '62': { name: 'Health Care & Social Assistance', min: 3.5, median: 5.5, max: 8.0 },
  '71': { name: 'Arts, Entertainment & Recreation', min: 2.5, median: 4.0, max: 6.0 },
  '72': { name: 'Accommodation & Food Services', min: 2.0, median: 3.5, max: 5.0 },
  '81': { name: 'Other Services (Repair, Personal, Religious)', min: 2.0, median: 3.5, max: 5.0 },
  '92': { name: 'Public Administration', min: 3.0, median: 4.5, max: 6.0 }
};

// Default fallback multiple
const DEFAULT_MULTIPLE = { name: 'General Business', min: 2.5, median: 4.0, max: 6.0 };

// Cache for loaded NAICS codes
let naicsCache = null;

/**
 * Load NAICS codes from CSV file
 */
function loadNAICSCodes() {
  if (naicsCache) {
    return naicsCache;
  }

  try {
    const csvPath = path.join(__dirname, '../../documents/vac_naics_codes.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    const codes = [];

    // Skip header rows (first 2 lines)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted fields)
      const parts = parseCSVLine(line);
      if (parts.length >= 2) {
        const code = parts[1].trim();
        const title = parts[2] ? parts[2].trim() : parts[0].replace(/^\d+\s*-\s*/, '').trim();

        if (code && /^\d{6}$/.test(code)) {
          codes.push({
            code,
            title,
            sector: code.substring(0, 2),
            subsector: code.substring(0, 3)
          });
        }
      }
    }

    naicsCache = codes;
    return codes;
  } catch (error) {
    console.error('Failed to load NAICS codes:', error.message);
    return [];
  }
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * Get all NAICS codes
 */
function getAllCodes() {
  return loadNAICSCodes();
}

/**
 * Get NAICS code by exact code
 */
function getByCode(code) {
  const codes = loadNAICSCodes();
  return codes.find(c => c.code === code) || null;
}

/**
 * Search NAICS codes by title (partial match)
 */
function searchByTitle(query, limit = 20) {
  if (!query || query.length < 2) {
    return [];
  }

  const codes = loadNAICSCodes();
  const lowerQuery = query.toLowerCase();

  const results = codes.filter(c =>
    c.title.toLowerCase().includes(lowerQuery)
  );

  return results.slice(0, limit);
}

/**
 * Get codes by sector (2-digit prefix)
 */
function getBySector(sector) {
  const codes = loadNAICSCodes();
  return codes.filter(c => c.sector === sector);
}

/**
 * Get industry multiple for a NAICS code
 */
function getMultipleForCode(code) {
  if (!code) {
    return { ...DEFAULT_MULTIPLE, source: 'default' };
  }

  const sector = code.toString().substring(0, 2);
  const sectorMultiple = SECTOR_MULTIPLES[sector];

  if (sectorMultiple) {
    return {
      ...sectorMultiple,
      source: 'sector',
      sector
    };
  }

  return { ...DEFAULT_MULTIPLE, source: 'default' };
}

/**
 * Get all sector multiples
 */
function getSectorMultiples() {
  return { ...SECTOR_MULTIPLES };
}

/**
 * Get statistics about loaded NAICS codes
 */
function getStats() {
  const codes = loadNAICSCodes();

  const sectorCounts = {};
  codes.forEach(c => {
    sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
  });

  return {
    totalCodes: codes.length,
    sectorCounts,
    sectorsWithMultiples: Object.keys(SECTOR_MULTIPLES).length
  };
}

/**
 * Clear cache (useful for testing or hot-reloading)
 */
function clearCache() {
  naicsCache = null;
}

module.exports = {
  getAllCodes,
  getByCode,
  searchByTitle,
  getBySector,
  getMultipleForCode,
  getSectorMultiples,
  getStats,
  clearCache,
  parseCSVLine,
  SECTOR_MULTIPLES,
  DEFAULT_MULTIPLE
};

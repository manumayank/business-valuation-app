/**
 * Migration: Create deal_analysis table
 *
 * Stores deal analysis results for M&A evaluations
 * Allows tracking of deal evaluations over time
 */

exports.up = async (db, run, get, all) => {
  // Create deal_analysis table
  await run(`
    CREATE TABLE IF NOT EXISTS deal_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valuation_id TEXT NOT NULL,
      deal_data TEXT NOT NULL,
      analysis_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(valuation_id) REFERENCES valuations(id),
      UNIQUE(valuation_id)
    )
  `);
  console.log('  Created table: deal_analysis');

  // Create indexes
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_deal_valuation ON deal_analysis(valuation_id)');
    console.log('  Created index: idx_deal_valuation');
  } catch (err) {
    console.log('  Index already exists: idx_deal_valuation');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_deal_created ON deal_analysis(created_at)');
    console.log('  Created index: idx_deal_created');
  } catch (err) {
    console.log('  Index already exists: idx_deal_created');
  }

  console.log('✓ Deal analysis table created');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop table
  await run('DROP TABLE IF EXISTS deal_analysis');
  console.log('✓ Deal analysis table dropped');
};

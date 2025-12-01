/**
 * Migration: Create working_capital_analysis table
 *
 * Stores working capital analysis results for valuations
 * Allows tracking of WC metrics over time and referencing past analyses
 */

exports.up = async (db, run, get, all) => {
  // Create working_capital_analysis table
  await run(`
    CREATE TABLE IF NOT EXISTS working_capital_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valuation_id TEXT NOT NULL,
      analysis_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(valuation_id) REFERENCES valuations(id),
      UNIQUE(valuation_id)
    )
  `);
  console.log('  Created table: working_capital_analysis');

  // Create indexes
  try {
    await run('CREATE INDEX IF NOT EXISTS idx_wc_valuation ON working_capital_analysis(valuation_id)');
    console.log('  Created index: idx_wc_valuation');
  } catch (err) {
    console.log('  Index already exists: idx_wc_valuation');
  }

  try {
    await run('CREATE INDEX IF NOT EXISTS idx_wc_created ON working_capital_analysis(created_at)');
    console.log('  Created index: idx_wc_created');
  } catch (err) {
    console.log('  Index already exists: idx_wc_created');
  }

  console.log('✓ Working capital analysis table created');
};

exports.down = async (db, run, get, all) => {
  // Rollback: Drop table
  await run('DROP TABLE IF EXISTS working_capital_analysis');
  console.log('✓ Working capital analysis table dropped');
};

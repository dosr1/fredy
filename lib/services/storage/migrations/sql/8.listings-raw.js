// Migration: Adding a new table to store raw data of listings

export function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings_raw
    (
      id         TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      link       TEXT,
      mime_type  TEXT,
      rawdata    BLOB,
      FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_listings_raw_listing_id ON listings_raw (listing_id);
  `);
}

// Migration: Add additionaldocuments column to listings table

export function up(db) {
  db.exec(`
    ALTER TABLE listings ADD COLUMN additionaldocuments TEXT;
  `);
}

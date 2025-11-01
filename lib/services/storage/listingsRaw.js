import SqliteConnection from './SqliteConnection.js';
import crypto from 'crypto';

// Download a URL into a Buffer and return { buf, mime }
// Uses global fetch (Node 18+). If your environment doesn't provide fetch,
// install and polyfill (e.g. `npm i undici` and set global.fetch).
async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${res.statusText}`);
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const mime = res.headers.get('content-type')?.split(';')[0] ?? null;
  return { buf, mime };
}

function isValidUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function genId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

/**
 * Save raw pictures for a listing.
 * pictures: array of url strings (may include null/invalid entries)
 * Returns number of successfully saved images.
 */
export async function saveRawPictures(listingId, pictures = []) {
  if (!listingId || !Array.isArray(pictures) || pictures.length === 0) return 0;

  // Download in parallel, ignore failures per-image
  const downloads = await Promise.all(
    pictures.map(async (link) => {
      if (!link || !isValidUrl(link)) return null;
      try {
        const { buf, mime } = await fetchBuffer(link);
        return { link, buf, mime };
      } catch (e) {
        console.warn(`Failed to download image: ${link}`, e);
        return null;
      }
    }),
  );

  const rows = downloads.filter(Boolean);
  if (rows.length === 0) return 0;

  const db = SqliteConnection.getConnection();

  const insert = db.prepare(
    `INSERT INTO listings_raw (id, listing_id, link, mime_type, rawdata)
     VALUES (@id, @listing_id, @link, @mime_type, @rawdata)`,
  );

  const trx = db.transaction((items) => {
    for (const it of items) {
      insert.run({
        id: genId(),
        listing_id: listingId,
        link: it.link,
        mime_type: it.mime ?? null,
        rawdata: it.buf,
      });
    }
  });

  trx(rows);
  return rows.length;
}

/**
 * Remove raw rows for a listing (used on delete/update).
 */
export function deleteRawForListing(listingId) {
  if (!listingId) return 0;
  const db = SqliteConnection.getConnection();
  const res = db.prepare('DELETE FROM listings_raw WHERE listing_id = ?').run(listingId);
  return res.changes ?? 0;
}

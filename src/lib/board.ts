import "server-only";
import { getDb } from "./db";

export type BoardItem = {
  id: number;
  userId: number;
  title: string;
  url: string | null;
  siteName: string | null;
  imageFile: string | null;
  imageUrl: string | null;
  notes: string;
  createdAt: number;
};

const COLS = `id, user_id userId, title, url, site_name siteName, image_file imageFile,
  image_url imageUrl, notes, created_at createdAt`;

export function listItems(userId: number): BoardItem[] {
  return getDb()
    .prepare(`SELECT ${COLS} FROM board_items WHERE user_id = ? ORDER BY created_at DESC, id DESC`)
    .all(userId) as BoardItem[];
}

export function getItem(id: number): BoardItem | null {
  return (getDb().prepare(`SELECT ${COLS} FROM board_items WHERE id = ?`).get(id) as BoardItem) ?? null;
}

export function boardSummaries(): Map<number, { count: number; covers: BoardItem[] }> {
  const rows = getDb()
    .prepare(`SELECT ${COLS} FROM board_items ORDER BY created_at DESC, id DESC`)
    .all() as BoardItem[];
  const map = new Map<number, { count: number; covers: BoardItem[] }>();
  for (const r of rows) {
    const s = map.get(r.userId) ?? { count: 0, covers: [] };
    s.count++;
    if (s.covers.length < 4 && (r.imageFile || r.imageUrl)) s.covers.push(r);
    map.set(r.userId, s);
  }
  return map;
}

export function addItem(item: Omit<BoardItem, "id" | "createdAt">): number {
  const res = getDb()
    .prepare(
      `INSERT INTO board_items (user_id, title, url, site_name, image_file, image_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(item.userId, item.title, item.url, item.siteName, item.imageFile, item.imageUrl, item.notes);
  return Number(res.lastInsertRowid);
}

export function updateItem(id: number, fields: { title: string; notes: string; url: string | null }) {
  getDb()
    .prepare("UPDATE board_items SET title = ?, notes = ?, url = ? WHERE id = ?")
    .run(fields.title, fields.notes, fields.url, id);
}

export function deleteItem(id: number) {
  getDb().prepare("DELETE FROM board_items WHERE id = ?").run(id);
}

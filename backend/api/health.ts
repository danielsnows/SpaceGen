/**
 * Health check leve: não carrega Express nem Sharp.
 * Evita timeout de cold start na função catch-all.
 */
export default function handler(_req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) {
  res.status(200).json({ ok: true });
}

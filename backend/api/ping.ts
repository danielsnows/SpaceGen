/**
 * Endpoint mínimo para testar se a Vercel está servindo funções em /api.
 * Se /api/ping responder 200 mas /api/health der 404, o problema está no catch-all ou no Express.
 */
export default function handler(_req: unknown, res: { status: (n: number) => { json: (o: object) => void } }) {
  res.status(200).json({ ok: true });
}

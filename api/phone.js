export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const html = await fetch('https://www.antutu.com/ranking/rank101.htm').then(r => r.text());
    const rowRE = /<ul class="list-unstyled newrank-b"[\s\S]*?<\/ul>/gi;
    const rows = [...html.matchAll(rowRE)];
    const list = rows.map((m, idx) => {
      const block = m[0];
      const name = (block.match(/<span class="model-name">([\s\S]+?)<\/span>/) || [])[1]?.trim() ?? '';
      const score = (block.match(/<li class="blast">([\s\S]+?)<\/li>/) || [])[1]?.trim() ?? '';

      return { top: idx + 1, phone: name, score };
    });

    return res.status(200).send(JSON.stringify({ code: 200, from: 'UPLCC API', choices: list },null,2));
  } catch (e) {
    return res.status(500).send(JSON.stringify({ code: 500, error: e.message },null,2));
  }
}

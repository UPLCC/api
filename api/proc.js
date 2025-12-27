export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let { type = 1 } = req.query;
  try {
    const html = await fetch(
      type == 1
        ? 'https://www.antutu.com/ranking/rank101.htm'
        : 'https://www.antutu.com/ranking/ios.htm'
    ).then(r => r.text());

    const rowRE = /<ul class="list-unstyled newrank-b"[\s\S]*?<\/ul>/gi;
    const list = [...html.matchAll(rowRE)].map((m, idx) => {
      const b = m[0];
      const name =
        (b.match(/<span class="model-name">([\s\S]+?)<\/span>/) ||
         b.match(/<div class="xjb-name-box">\s*<span>([^<]+)<\/span>/))[1]
          ?.trim() ?? '';
      const score =
        (b.match(/<li class="blast">([\s\S]+?)<\/li>/) || [])[1]
          ?.trim() ?? '';
      const soc =
        (b.match(/<span class="memory">\(([^)]+)\)<\/span>/) || [])[1]
          ?.trim() ?? '';
      return { top: idx + 1, phone: name, score, soc };
    });

    return res.status(200).send(
      JSON.stringify({ code: 200, from: 'UPLCC API', choices: list }, null, 2)
    );
  } catch (e) {
    return res.status(500).send(
      JSON.stringify({ code: 500, error: e.message }, null, 2)
    );
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    return res.status(204).end();
  }
  if (!req.url.startsWith('/mimo')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  const { key: K, msg: M, id: uid } = req.query;
  if (!K || !M) {
    return res.status(400).json({ error: '缺少 key 或 msg' });
  }
  const finalUid = uid || `UPLCCscaAIID${Math.round(Math.random() * 9999999999)}`;
  try {
    const upstreamRes = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${K}`,
      },
      body: JSON.stringify({
        model: 'mimo-v2-flash',
        messages: [
          { role: 'system', content: '你是MiMo，小米公司研发的AI智能助手。' },
          { role: 'user', content: M },
        ],
        id: finalUid,
        max_completion_tokens: 8192,
        temperature: 0.3,
        top_p: 0.95,
        stream: false,
        thinking: { type: 'enabled' },
      }),
    });
    res.status(upstreamRes.status);
    ['content-type', 'x-ratelimit-limit', 'x-ratelimit-remaining'].forEach(h => {
      if (upstreamRes.headers.has(h)) res.setHeader(h, upstreamRes.headers.get(h));
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      return res.status(upstreamRes.status).send(text);
    }

    const data = await upstreamRes.json();
    const choice = data.choices?.[0] || {};
    const responseA = choice.reasoning_content ?? '';
    const responseB = choice.content ?? '';

    return res.json({
      code: 200,
      from: 'UPLCC API',
      message: responseB,
      reason: responseA,
    });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Upstream error', detail: e.message });
  }
}

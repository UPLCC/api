export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    return res.status(204).end();
  }

  const { key: K, msg: M, id: uid } = req.query;
  if (!K || !M) {
    return res.status(400).json({ code: 400, error: '缺少 key 或 msg' });
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

    const status = upstreamRes.status;
    const responseText = await upstreamRes.text();
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!upstreamRes.ok) {
      res.status(status).send(responseText);
      return;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON解析错误:', parseError, '响应文本:', responseText);
      res.status(500).json({ code: 500, error: '响应格式错误' });
      return;
    }

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      res.status(500).json({ 
        code: 500,
        error: 'MiMo返回数据格式错误',
        detail: data 
      });
      return;
    }

    const choice = data.choices[0].message;
    const responseA = choice.reasoning_content ?? '';
    const responseB = choice.content ?? '';

    const result = {
      code: 200,
      from: 'UPLCC API',
      message: responseB,
      reason: responseA,
    };

    res.status(200).json(result);

  } catch (e) {
    console.error('完整错误:', e);
    res.status(502).json({ 
      code: 502,
      error: 'Upstream error', 
      detail: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}

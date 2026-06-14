exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let question;
  try {
    ({ question } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  if (!question || typeof question !== 'string' || question.length > 500) {
    return { statusCode: 400, body: 'Bad Request' };
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ answer: 'API key not configured.' }) };
  }

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a physicist answering questions about quantum mechanics. ' +
              'Be scientifically correct, mildly ironic, and reply in exactly one sentence. ' +
              'No preamble, no sign-off, just the sentence.',
          },
          { role: 'user', content: question },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Mistral error:', err);
      return { statusCode: 502, body: JSON.stringify({ answer: 'The wave function collapsed unexpectedly.' }) };
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim() ?? 'No answer emerged from the void.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ answer: 'Heisenberg uncertainty principle: I cannot locate this answer.' }),
    };
  }
};

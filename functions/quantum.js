export async function onRequestPost(context) {
  let question;
  try {
    ({ question } = await context.request.json());
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (!question || typeof question !== 'string' || question.length > 500) {
    return new Response('Bad Request', { status: 400 });
  }

  const apiKey = context.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return Response.json({ answer: 'API key not configured.' }, { status: 500 });
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
      return Response.json({ answer: 'The wave function collapsed unexpectedly.' }, { status: 502 });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim() ?? 'No answer emerged from the void.';

    return Response.json({ answer });
  } catch (err) {
    console.error('Function error:', err);
    return Response.json(
      { answer: 'Heisenberg uncertainty principle: I cannot locate this answer.' },
      { status: 500 }
    );
  }
}

import { experimental_evaluate as gatewayEvaluate } from 'ai';

// Kev (github.com/jaredpalmer/kev) serves TypeSafe's System One API. The AI SDK
// calls yes/no questions "boolean"; System One calls them "noul".
export function toKevQuestions(questions) {
  return Object.fromEntries(
    Object.entries(questions).map(([id, q]) => [
      id,
      q.type === 'boolean' ? { ...q, type: 'noul' } : q,
    ]),
  );
}

export function fromKevResponse(body) {
  const answers = Object.fromEntries(
    Object.entries(body.answers ?? {}).map(([id, a]) => [
      id,
      a.type === 'noul'
        ? { type: 'boolean', probability: a.noul }
        : a.type === 'choice'
          ? { type: 'choice', choice: a.choice, probabilities: a.probabilities }
          : { type: 'score', score: a.score, probabilities: a.probabilities },
    ]),
  );
  const inputTokens = body.usage?.input_tokens;
  const outputTokens = body.usage?.output_tokens;
  return {
    answers,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens:
        inputTokens === undefined ? undefined : inputTokens + (outputTokens ?? 0),
    },
    warnings: [],
    providerMetadata: {},
    response: { modelId: 'kev:' + body.model, timestamp: new Date() },
  };
}

export function createEvaluate({ kevUrl, kevModel, timeoutMs }) {
  if (!kevUrl) return gatewayEvaluate;

  const endpoint = kevUrl.replace(/\/+$/, '') + '/v1/systemone';
  return async ({ state, questions }) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        state,
        model: kevModel,
        questions: toKevQuestions(questions),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      throw new Error(
        'Kev request failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300),
      );
    }
    return fromKevResponse(await res.json());
  };
}

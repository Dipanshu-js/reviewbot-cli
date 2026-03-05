import Conf from 'conf';

const store = new Conf({
  projectName: 'reviewbot-cli',
  schema: {
    provider: { type: 'string', default: 'openai' },
    model:    { type: 'string', default: '' },
    apiKey:   { type: 'string', default: '' },
  },
});

export async function getConfig() {
  return {
    provider: store.get('provider') || 'openai',
    model:    store.get('model')    || undefined,
    apiKey:   store.get('apiKey')   || undefined,
  };
}

export async function setConfig(values) {
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== '') store.set(k, v);
  }
}

export async function clearConfig() { store.clear(); }
export function configPath() { return store.path; }

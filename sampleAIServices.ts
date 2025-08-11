// Sample AI services data
const sampleAIServices = [
  {
    id: '1',
    name: 'Google AI',
    description: "Google's artificial intelligence platform",
    models: [
      {
        id: '1-1',
        name: 'Gemini Pro',
        provider: 'Google',
        capabilities: ['text', 'image', 'code']
      },
      {
        id: '1-2',
        name: 'Gemini Ultra',
        provider: 'Google',
        capabilities: ['text', 'image', 'code', 'audio', 'video']
      }
    ]
  },
  {
    id: '2',
    name: 'OpenAI',
    description: "OpenAI's language models",
    models: [
      {
        id: '2-1',
        name: 'GPT-4',
        provider: 'OpenAI',
        capabilities: ['text', 'code']
      },
      {
        id: '2-2',
        name: 'GPT-4 Vision',
        provider: 'OpenAI',
        capabilities: ['text', 'image', 'code']
      }
    ]
  },
  {
    id: '3',
    name: 'Anthropic',
    description: "Anthropic's Claude models",
    models: [
      {
        id: '3-1',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        capabilities: ['text', 'image', 'code']
      },
      {
        id: '3-2',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        capabilities: ['text', 'code']
      }
    ]
  }
];

export default sampleAIServices;
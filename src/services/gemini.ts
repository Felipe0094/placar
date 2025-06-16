// Função para obter resultados de jogos usando Gemini
export async function getMatchResults(matchDescription: string) {
  try {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('API key não encontrada. Verifique se VITE_GEMINI_API_KEY está definida no .env.local');
    }

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    const prompt = `
      Analise a seguinte descrição de jogo e extraia os placares:
      "${matchDescription}"
      
      Retorne apenas um objeto JSON com o seguinte formato:
      {
        "home_score": número ou null,
        "away_score": número ou null,
        "status": "upcoming" | "live" | "finished"
      }
      
      Se não houver placares, retorne null para os scores.
      Se o jogo ainda não começou, status deve ser "upcoming".
      Se o jogo está acontecendo, status deve ser "live".
      Se o jogo terminou, status deve ser "finished".
    `;

    console.log('🔍 Enviando requisição para Gemini...');
    console.log('URL:', API_URL);
    console.log('Prompt:', prompt);

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log('📥 Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na API do Gemini:', errorData);
      throw new Error(`Erro na API do Gemini: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('📦 Resposta completa do Gemini:', data);

    // Extrai o texto da resposta
    const text = data.candidates[0].content.parts[0].text;
    console.log('📝 Texto extraído:', text);

    // Tenta fazer o parse do JSON retornado
    try {
      const parsedResult = JSON.parse(text);
      console.log('✅ JSON parseado com sucesso:', parsedResult);
      return parsedResult;
    } catch (e) {
      console.error('❌ Erro ao fazer parse da resposta do Gemini:', e);
      return null;
    }
  } catch (error) {
    console.error('💥 Erro ao consultar Gemini:', error);
    return null;
  }
} 
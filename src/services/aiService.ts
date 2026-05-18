import { News, TransparencyDocument, Presidencia, Diretoria, GaleriaPresidente } from '../api';

export async function getAiResponse(
  query: string,
  context: {
    news: News[];
    documents: TransparencyDocument[];
    presidencia: Presidencia | null;
    diretorias: Diretoria[];
    galeria: GaleriaPresidente[];
  }
) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na resposta do servidor');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error in AI service:', error);
    if (error instanceof Error) {
      return `Desculpe, ocorreu um erro ao processar sua pergunta: ${error.message}`;
    }
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente mais tarde.';
  }
}

export async function getAiResponseWithPdf(
  query: string,
  pdfUrl: string,
  context: any
) {
  // For simplicity, we can route this to the same endpoint or a specialized one.
  // Since we're switching to OpenAI, we can't easily use urlContext like Gemini.
  // We'll just append the PDF URL to the query for now, or the user can implement extraction on server.
  return getAiResponse(`Contexto PDF: ${pdfUrl}\n\nPergunta: ${query}`, context);
}

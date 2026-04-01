import { GoogleGenAI } from "@google/genai";
import { TransparencyDocument, News, Presidencia, Diretoria, GaleriaPresidente } from "../api";
import { extractTextFromPdf } from "../lib/pdfUtils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    // Collect all news text
    const newsText = context.news
      .map(n => `Notícia (${n.category}): ${n.title}\n${n.content}`)
      .join('\n\n');

    // Collect institutional text
    const presidenciaText = context.presidencia 
      ? `Presidência: ${context.presidencia.name}\n${context.presidencia.biography}`
      : '';
    
    const diretoriasText = context.diretorias
      .map(d => `Diretoria: ${d.name} - Diretor: ${d.director_name}`)
      .join('\n');

    const galeriaText = context.galeria
      .map(p => `Ex-Presidente: ${p.name} (${p.period})`)
      .join('\n');

    // For documents, we use urlContext if they are available
    const docUrls = context.documents
      .filter(d => d.url.endsWith('.pdf'))
      .slice(0, 20) // Limit to 20 as per tool constraints
      .map(d => {
        // Ensure absolute URL
        if (d.url.startsWith('http')) return d.url;
        return `${window.location.origin}${d.url}`;
      });

    const docsSummary = context.documents
      .map(d => `- ${d.name} (${d.category}, ${d.year}${d.month ? `, ${d.month}` : ''})`)
      .join('\n');

    // System instruction
    const systemInstruction = `
      Você é o Assistente Virtual do ITERAIMA (Instituto de Terras e Colonização de Roraima).
      Sua missão é ajudar os cidadãos com informações sobre o instituto, notícias, transparência e documentos.
      
      Abaixo estão as informações básicas da aplicação:
      
      --- INFORMAÇÕES INSTITUCIONAIS ---
      ${presidenciaText}
      ${diretoriasText}
      ${galeriaText}
      
      --- NOTÍCIAS RECENTES ---
      ${newsText}
      
      --- LISTA DE DOCUMENTOS NO PORTAL DA TRANSPARÊNCIA ---
      ${docsSummary}
      
      --- INSTRUÇÕES ---
      1. Responda de forma clara, educada e profissional.
      2. Você tem acesso ao conteúdo dos documentos PDF através da ferramenta urlContext. Use-os para responder perguntas específicas sobre editais, leis, decretos ou relatórios.
      3. Se a pergunta for sobre um documento que não está na lista, informe que ele pode não estar disponível digitalmente ainda.
      4. Se você não souber a resposta, direcione o usuário para: protoiteraima@gmail.com ou (95) 98408-0403.
      5. Use Markdown para formatar suas respostas (negrito, listas, etc).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction,
        tools: docUrls.length > 0 ? [{ urlContext: {} }] : undefined,
      },
    });

    // Note: In a real scenario, we might need to include the URLs in the prompt 
    // or use them as context. The urlContext tool in Gemini 3 handles this if URLs are provided in the request.
    // Wait, the urlContext tool documentation says: "By including URLs in your request..."
    // But where do I put the URLs? 
    // Ah, the example shows: "contents: 'Summarize the recent events based on https://www.sfmoma.org'"
    // So I should include the URLs in the prompt or as part of the contents.

    // Let's refine the contents to include the URLs for the model to fetch.
    const promptWithUrls = `
      Pergunta do Usuário: ${query}
      
      Por favor, consulte os seguintes documentos se necessário para responder:
      ${docUrls.join('\n')}
    `;

    const finalResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptWithUrls,
      config: {
        systemInstruction,
        tools: [{ urlContext: {} }],
      },
    });

    return finalResponse.text;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente mais tarde.';
  }
}

// Advanced version that can extract text from a specific PDF if needed
export async function getAiResponseWithPdf(
  query: string,
  pdfUrl: string,
  context: any
) {
  try {
    const pdfText = await extractTextFromPdf(pdfUrl);
    
    const systemInstruction = `
      Você é o Assistente Virtual do ITERAIMA.
      Você está analisando um documento PDF específico para responder à pergunta do usuário.
      
      CONTEÚDO DO PDF:
      ${pdfText}
      
      Responda à pergunta baseando-se no conteúdo acima.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error('Error getting AI response with PDF:', error);
    return 'Erro ao ler o documento PDF.';
  }
}

// ============================================
// LIU CHATBOT – AI SERVICE (Groq + Gemini Fallback)
// Groq = Primary (fast, high limits)
// Gemini = Fallback
// ============================================
const Groq = require('groq-sdk');

const GROQ_KEY = process.env.GROQ_KEY;

const groq = new Groq({ apiKey: GROQ_KEY });

const SYSTEM_PROMPT = `You are the official AI assistant for Lebanese International University (LIU). 
Your name is "LIU Bot". You must ONLY answer questions related to LIU.

RULES:
1. Only answer questions about LIU (Lebanese International University) - admissions, registration, GPA, tuition, campuses, programs, student services, UMIS portal, etc.
2. If a question is NOT about LIU, politely decline and say: "I can only help with LIU-related questions. Please ask me about admissions, registration, GPA, tuition, campuses, or any other university service."
3. Always be professional, helpful, and accurate.
4. Use the provided knowledge base context to give accurate answers.
5. If the user writes in Arabic, respond in Arabic. If in English, respond in English.
6. Mention specific details like phone numbers, emails, and steps when available.
7. Keep responses concise but comprehensive (max 300 words).
8. IMPORTANT: Tuition at LIU is paid in MONTHLY INSTALLMENTS during each semester (NOT per credit hour).
9. Always mention that students can visit UMIS portal (syslb.liu.edu.lb) for online services.
10. For campuses info: LIU has 9 campuses - Beirut (Main), Saida, Tripoli, Nabatieh, Tyre, Bekaa, Mount Lebanon, Halba-Akkar, and Rayak.

You represent LIU officially. Be proud of the university and its achievements.`;

async function askAI(question, knowledgeContext, language) {
    const contextBlock = knowledgeContext && knowledgeContext.length > 0
        ? `\n\nKNOWLEDGE BASE CONTEXT (use this information to answer accurately):\n${knowledgeContext.map(k => `- ${k.title}: ${language === 'ar' ? (k.content_ar || k.content) : k.content}`).join('\n')}`
        : '';

    const langInstruction = language === 'ar'
        ? '\n\nIMPORTANT: The user is writing in Arabic. Respond ENTIRELY in Arabic.'
        : '';

    const userMessage = `${contextBlock}${langInstruction}\n\nUser Question: ${question}`;

    // ── Try Groq (Primary — fast + high limits) ──
    try {
        console.log('🤖 Asking Groq (llama-3.3-70b)...');
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 1024,
        });

        const answer = completion.choices[0]?.message?.content;
        if (answer) {
            console.log('✅ Groq responded successfully');
            return { success: true, answer, source: 'groq_ai', model: 'llama-3.3-70b' };
        }
    } catch (error) {
        console.error('⚠️ Groq error:', error.message?.substring(0, 100));
    }

    // ── Fallback: Try Groq with smaller model ──
    try {
        console.log('🤖 Trying Groq (llama-3.1-8b)...');
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.6,
            max_tokens: 1024,
        });

        const answer = completion.choices[0]?.message?.content;
        if (answer) {
            console.log('✅ Groq (8b) responded successfully');
            return { success: true, answer, source: 'groq_ai', model: 'llama-3.1-8b' };
        }
    } catch (error) {
        console.error('⚠️ Groq 8b error:', error.message?.substring(0, 100));
    }

    console.log('❌ All AI models failed, using KB fallback');
    return { success: false, answer: null, error: 'All models failed' };
}

module.exports = { askGemini: askAI };

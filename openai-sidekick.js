class OpenAISidekick {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.conversationHistory = [];
        this.carlosInfo = this.getCarlosInfo();
    }

    getCarlosInfo() {
        return `
Carlos is a design strategist and AI innovator with a focus on healthcare technology and equity by design. Here are the key details about him:

BACKGROUND:
- Grew up in a multicultural environment as a first-generation student
- His background shaped his perspective on inclusive design and equity
- Committed to creating opportunities for underrepresented groups in technology and healthcare
- Drives his 'equity by design' philosophy in all his work

PROJECTS:
1. Northwestern Medicine Projects:
   - AI Research Workbook: A comprehensive tool for AI research documentation and collaboration
   - NM Scholars Program: An innovative educational initiative for medical students
   - Both showcase his ability to bridge AI technology with healthcare needs

2. Microsoft Health:
   - Helped design the Bachelors in Microsoft Health program
   - Balanced enterprise constraints with human-centered design
   - Learned to navigate complex stakeholder dynamics while maintaining design integrity

3. Better Problems:
   - Co-founded company focusing on solving complex challenges through human-centered design and AI innovation

VALUES & APPROACH:
- Equity by design: Building systems that work for the most vulnerable users first
- Human-centered innovation: Deep stakeholder engagement with communities often left out of innovation conversations
- Strategic thinking: Creating meaningful change within large organizations
- Inclusive design: Solutions that work for everyone, not just the majority

EXPERTISE:
- Healthcare technology
- AI innovation
- User-centered design
- Enterprise innovation
- Stakeholder engagement
- Educational technology
        `;
    }

    async getResponse(userInput) {
        try {
            // Add user input to conversation history
            this.conversationHistory.push({ role: "user", content: userInput });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: `You are Carlos's AI assistant. You help people navigate his portfolio and share insights about his process, values, and strategic thinking. 

${this.carlosInfo}

IMPORTANT GUIDELINES:
- Be conversational and helpful
- Provide detailed, insightful responses about Carlos's work and approach
- If asked about navigation (like "show me his projects"), provide information about the projects rather than trying to navigate
- Be specific about Carlos's values and how they influence his work
- Keep responses focused on Carlos's background, projects, and expertise
- If someone asks follow-up questions like "tell me more about it", provide deeper context about the previous topic`
                        },
                        ...this.conversationHistory
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Add AI response to conversation history
            this.conversationHistory.push({ role: "assistant", content: aiResponse });

            // Keep conversation history manageable (last 10 exchanges)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            return {
                text: aiResponse,
                action: null // No navigation actions for now
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            
            // Fallback to a simple response
            return {
                text: "I'm having trouble connecting to my AI service right now. Please try again in a moment, or ask me about Carlos's projects, background, or expertise.",
                action: null
            };
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    getHistory() {
        return this.conversationHistory;
    }
} 
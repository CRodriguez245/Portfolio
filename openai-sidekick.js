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
   - ResearchBridge: A multi-modal research companion for students and instructors that Carlos led from concept to adoption. Designed to make academic research less intimidating and more equitable for first-generation and underrepresented high school students. Features scaffolded GPT-powered modules, multi-modal outputs, and instructor dashboards. Results: 3× improvement in insight quality, 95% confidence gains, 100% adoption into next-year curriculum.
   - NM Scholars Program: An innovative educational initiative where Carlos reframed cohort structure by identity resonance rather than age/grade, formalized APC roles for student-led engagement. Key insight: Confidence, not research ability, was the strongest predictor of engagement.
   - Both showcase his ability to bridge AI technology with healthcare needs while focusing on equity and inclusion

2. Microsoft Health:
   - Program Manager and AI Integration Strategist for Bachelors in Microsoft Health program
   - Discovered that internal education is often more about cultural permission than curriculum
   - Many experts needed validation that their tacit knowledge mattered
   - Shaped product strategy to focus on building confidence and recognition rather than just delivering content
   - Balanced enterprise constraints with human-centered design principles

3. Better Problems:
   - Independent practice focused on reframing problems rather than rushing to solutions
   - Combines essays with strategy work for mission-aligned teams navigating complexity
   - Tone is intentional, critical, and curious - meant to provoke reflection, not just agreement

4. EPICAC:
   - Interactive installation where a Raspberry Pi and Epson thermal printer generate and print original love poems in real time
   - Reinterpretation of Kurt Vonnegut's EPICAC exploring emotional AI, disposable intimacy, and literary HCI
   - The printer hums softly, designed to feel like early terminals

5. GA.V.NO:
   - Storytelling platform exploring Brazilian music, culture, and design
   - Lives between studio and sound booth - part mixtape, part design reflection
   - Ties rhythms and identity to modular product concepts

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
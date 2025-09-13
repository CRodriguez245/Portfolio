class RAGAISidekick {
    constructor() {
        this.knowledgeBase = null;
        this.conversationHistory = [];
        this.currentContext = null;
        this.loadKnowledgeBase();
    }

    async loadKnowledgeBase() {
        try {
            const response = await fetch('knowledge-base.json');
            this.knowledgeBase = await response.json();
            console.log('Knowledge base loaded successfully');
        } catch (error) {
            console.error('Error loading knowledge base:', error);
            this.knowledgeBase = null;
        }
    }

    // Simple text similarity function
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }

    // Extract relevant chunks from knowledge base
    retrieveRelevantChunks(query, topK = 3) {
        if (!this.knowledgeBase) return [];

        const chunks = this.flattenKnowledgeBase(this.knowledgeBase);
        const scoredChunks = chunks.map(chunk => ({
            ...chunk,
            score: this.calculateSimilarity(query, chunk.text)
        }));

        return scoredChunks
            .filter(chunk => chunk.score > 0.1) // Only include relevant chunks
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    // Flatten the nested knowledge base into searchable chunks
    flattenKnowledgeBase(data, prefix = '') {
        const chunks = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                // If it has a description, create a chunk
                if (value.description) {
                    chunks.push({
                        topic: key,
                        text: value.description,
                        keywords: value.keywords || [],
                        title: value.title || key
                    });
                }
                
                // If it has keywords, create a chunk
                if (value.keywords && Array.isArray(value.keywords)) {
                    chunks.push({
                        topic: key,
                        text: `${key}: ${value.keywords.join(', ')}`,
                        keywords: value.keywords,
                        title: value.title || key
                    });
                }
                
                // Recursively process nested objects
                chunks.push(...this.flattenKnowledgeBase(value, `${prefix}${key}.`));
            }
        }
        
        return chunks;
    }

    // Generate response using RAG approach
    generateResponse(query, conversationHistory = []) {
        this.conversationHistory = conversationHistory;
        
        // Check for context continuation
        if (this.isContextContinuation(query)) {
            return this.handleContextContinuation(query);
        }

        // Retrieve relevant chunks
        const relevantChunks = this.retrieveRelevantChunks(query);
        
        if (relevantChunks.length === 0) {
            return this.getDefaultResponse();
        }

        // Store context for future reference
        this.currentContext = {
            topic: relevantChunks[0].topic,
            chunks: relevantChunks,
            query: query
        };

        // Generate response based on retrieved chunks
        return this.generateResponseFromChunks(relevantChunks, query);
    }

    isContextContinuation(query) {
        const continuationPhrases = [
            'tell me more about it',
            'tell me more',
            'more about it',
            'more details',
            'what else',
            'continue',
            'go on',
            'elaborate',
            'explain more',
            'more',
            'it'
        ];

        const lowercaseQuery = query.toLowerCase();
        return continuationPhrases.some(phrase => lowercaseQuery.includes(phrase));
    }

    handleContextContinuation(query) {
        if (!this.currentContext) {
            return "I'd be happy to tell you more! What specific topic would you like to know about?";
        }

        // Get more detailed information about the current context
        const detailedResponses = {
            'northwestern medicine': "Carlos has two really impactful projects at Northwestern Medicine! First, there's ResearchBridge - his multi-modal research companion that helps first-generation students build confidence in research. Then there's the NM Scholars Program, where he redesigned how cohorts work by focusing on identity resonance rather than just age or grade. Both projects show his knack for making complex systems more equitable and human-centered.",
            'nm scholars': "The NM Scholars Program is such a cool project! Carlos completely reimagined how cohorts work - instead of grouping students by age or grade, he organized them by identity resonance. He also formalized APC roles to create student-led engagement. The key insight? Confidence, not research ability, was the strongest predictor of engagement. Once students felt they belonged, everything changed!",
            'researchbridge': "ResearchBridge is honestly one of Carlos's most impressive projects! It started as an AI workbook but grew into this comprehensive multi-modal research companion. The coolest part is how it serves both students and instructors - students get scaffolds that boost their confidence and curiosity, while instructors get visibility into engagement patterns. The results speak for themselves: 3× improvement in insight quality and 95% confidence gains!",
            'microsoft health': "Carlos's work at Microsoft Health was really fascinating! He focused on internal education and discovered something crucial - it's often more about cultural permission than curriculum. Many experts needed validation that their tacit knowledge mattered. This insight shaped his product strategy to focus on building confidence and recognition rather than just delivering content.",
            'better problems': "Better Problems is such a thoughtful project! It's Carlos's independent practice focused on reframing problems rather than rushing to solutions. He combines essays with strategy work for mission-aligned teams navigating complexity. The tone is intentional, critical, and curious - meant to provoke reflection, not just agreement.",
            'epicac': "EPICAC is such a creative project! It's this interactive installation where a Raspberry Pi and Epson thermal printer generate and print original love poems in real time. It's a reinterpretation of Kurt Vonnegut's EPICAC exploring emotional AI, disposable intimacy, and literary HCI. The printer actually hums softly - it's designed to feel like early terminals!",
            'gavno': "GA.V.NO is a unique project that shows Carlos's creative side! It's a storytelling platform exploring Brazilian music, culture, and design. It lives between studio and sound booth - part mixtape, part design reflection - tying rhythms and identity to modular product concepts. It's all about music as method and cultural storytelling.",
            'healthcare': "Carlos has such interesting experience in healthcare technology! His approach always combines AI innovation with deep understanding of healthcare needs. Whether it's making research more accessible for students or helping experts share their knowledge, he focuses on building confidence and equity into the system.",
            'ai': "Carlos has this really thoughtful approach to AI development! He specializes in human-centered AI that serves real user needs while driving business value. His work spans from healthcare applications to educational tools, always prioritizing user experience and measurable outcomes. He's particularly good at designing AI that builds user confidence rather than creating dependency.",
            'design': "Carlos's design approach is so grounded in human-centered principles! He combines user research with business strategy to create products that not only meet user needs but also drive measurable business impact. His work shows how good design can create competitive advantages and real value.",
            'strategy': "Carlos has this really nuanced strategic approach! He excels at understanding both user needs and business constraints, identifying opportunities where human-centered design can create competitive advantages. His work shows how strategic thinking can drive real business value while staying true to user needs.",
            'leadership': "Carlos is such a strong cross-functional leader! He has this ability to bridge technical, design, and business perspectives, creating shared understanding of product vision and success metrics across diverse teams. His leadership style really shows in how he brings people together around common goals."
        };

        const topic = this.currentContext.topic.toLowerCase();
        for (const [key, response] of Object.entries(detailedResponses)) {
            if (topic.includes(key) || key.includes(topic)) {
                return response;
            }
        }

        // Fallback to using the retrieved chunks
        return this.generateResponseFromChunks(this.currentContext.chunks, query);
    }

    generateResponseFromChunks(chunks, query) {
        if (chunks.length === 0) {
            return this.getDefaultResponse();
        }

        const topChunk = chunks[0];
        
        // Generate a conversational response based on the chunk content
        if (topChunk.score > 0.3) {
            return this.formatResponse(topChunk.text, topChunk.title, query);
        } else {
            // Combine multiple chunks for a more comprehensive response
            const combinedText = chunks
                .slice(0, 2)
                .map(chunk => chunk.text)
                .join(' ');
            
            return this.formatResponse(combinedText, topChunk.title, query);
        }
    }

    formatResponse(content, title, query) {
        // Add conversational elements to make responses more personable
        const conversationalStarters = [
            "Great question! ",
            "I'd love to tell you about ",
            "Absolutely! ",
            "Sure thing! ",
            "Here's what I can share about ",
            "Let me tell you about ",
            "That's a great topic! "
        ];

        const starter = conversationalStarters[Math.floor(Math.random() * conversationalStarters.length)];
        
        // Add a personal touch based on the content
        let response = starter;
        
        if (title && title.toLowerCase().includes('researchbridge')) {
            response += `ResearchBridge is one of Carlos's most impactful projects. `;
        } else if (title && title.toLowerCase().includes('nm scholars')) {
            response += `The NM Scholars Program is a fascinating project Carlos worked on. `;
        } else if (title && title.toLowerCase().includes('microsoft')) {
            response += `Carlos's work at Microsoft was really interesting. `;
        } else if (title && title.toLowerCase().includes('epicac')) {
            response += `EPICAC is such a creative project! `;
        } else if (title && title.toLowerCase().includes('gavno')) {
            response += `GA.V.NO is a unique project that shows Carlos's creative side. `;
        } else if (title && title.toLowerCase().includes('better problems')) {
            response += `Better Problems is a great example of Carlos's strategic thinking. `;
        }

        // Add the content with some conversational flow
        response += content;
        
        // Add a conversational ending
        const endings = [
            " Feel free to ask me more about this!",
            " What else would you like to know?",
            " I can dive deeper into any aspect you're curious about.",
            " Let me know if you want more details on this!",
            " Happy to elaborate on any part of this."
        ];
        
        const ending = endings[Math.floor(Math.random() * endings.length)];
        response += ending;
        
        return response;
    }

    getDefaultResponse() {
        const responses = [
            "Hey there! I'd love to help you explore Carlos's work! You can ask me about his projects like ResearchBridge, NM Scholars, or his work at Microsoft. I can also tell you about his approach to AI, design, or strategy. What catches your interest?",
            "Hi! I'm here to share insights about Carlos's portfolio and his approach to product work. Feel free to ask about his projects, his experience with AI and healthcare, or his strategic thinking. What would you like to know?",
            "Hello! I can tell you all about Carlos's projects and his unique approach to product development. Try asking about ResearchBridge, the NM Scholars Program, or his work at Microsoft. What's on your mind?",
            "Hey! I'm excited to share Carlos's work with you! You can ask about his projects, his experience in healthcare and AI, or his design philosophy. What would you like to explore first?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Set context explicitly (for navigation actions)
    setContext(topic, response) {
        this.currentContext = {
            topic: topic,
            chunks: [{
                topic: topic,
                text: response,
                score: 1.0
            }],
            query: topic
        };
        console.log('Context set:', this.currentContext);
    }
} 
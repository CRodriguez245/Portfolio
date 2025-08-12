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
            'northwestern medicine': "Carlos has two major projects at Northwestern Medicine. First, the AI Research Workbook - a comprehensive tool for AI research documentation and collaboration. Second, the NM Scholars Program - an innovative educational initiative for medical students. Both projects showcase his ability to bridge AI technology with healthcare needs, focusing on user-centered design and measurable outcomes.",
            'nm scholars': "The NM Scholars Program is Carlos's innovative educational initiative at Northwestern Medicine. It's designed to enhance medical education through AI-powered learning tools and collaborative platforms. The program focuses on creating engaging learning experiences that help medical students develop critical thinking and research skills.",
            'ai research workbook': "The AI Research Workbook is Carlos's comprehensive tool for AI research documentation and collaboration. It's designed to streamline the research process, making it easier for teams to document findings, share insights, and collaborate effectively. The workbook combines user-friendly design with powerful AI capabilities.",
            'microsoft health': "Carlos's work with Microsoft Health focused on developing AI-powered healthcare solutions. His projects included improving patient-provider communication, streamlining clinical workflows, and creating tools that enhance healthcare delivery while maintaining the human touch.",
            'better problems': "Better Problems is Carlos's co-founded company that focuses on solving complex challenges through human-centered design and AI innovation. The company works on projects that require deep understanding of user needs, business constraints, and technological possibilities.",
            'healthcare': "Carlos has extensive experience in healthcare technology, working on projects that improve patient care, streamline clinical workflows, and enhance provider-patient communication. His approach combines AI innovation with deep understanding of healthcare needs.",
            'ai': "Carlos specializes in human-centered AI development, focusing on creating AI systems that serve real user needs while driving business value. His work spans from healthcare applications to educational tools, always prioritizing user experience and measurable outcomes.",
            'design': "Carlos's design approach focuses on human-centered principles, combining user research with business strategy. He creates products that not only meet user needs but also drive measurable business impact.",
            'strategy': "Carlos's strategic approach involves understanding both user needs and business constraints. He excels at identifying opportunities where human-centered design can create competitive advantages and drive business value.",
            'leadership': "Carlos excels at cross-functional leadership, bridging technical, design, and business perspectives. He creates shared understanding of product vision and success metrics across diverse teams."
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
        
        // Generate a response based on the chunk content
        if (topChunk.score > 0.3) {
            return topChunk.text;
        } else {
            // Combine multiple chunks for a more comprehensive response
            const combinedText = chunks
                .slice(0, 2)
                .map(chunk => chunk.text)
                .join(' ');
            
            return combinedText;
        }
    }

    getDefaultResponse() {
        return "I can help you navigate through Carlos's portfolio and share insights about his process, values, and strategic thinking! Try asking about his projects, experience, AI work, healthcare experience, Northwestern Medicine projects, or dive deeper into his process, values, strategy, collaboration style, or innovation approach. What would you like to explore?";
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
class EnhancedAISidekick {
    constructor() {
        this.knowledgeBase = null;
        this.conversationContext = {
            lastTopic: null,
            lastResponse: null,
            conversationHistory: []
        };
        this.loadConversationContext();
        this.loadKnowledgeBase();
    }

    loadConversationContext() {
        try {
            const savedContext = sessionStorage.getItem('aiSidekickContext');
            console.log('Loading saved context:', savedContext);
            if (savedContext) {
                this.conversationContext = JSON.parse(savedContext);
                console.log('Loaded context:', this.conversationContext);
            } else {
                console.log('No saved context found');
            }
        } catch (error) {
            console.error('Error loading conversation context:', error);
        }
    }

    saveConversationContext() {
        try {
            const contextToSave = JSON.stringify(this.conversationContext);
            sessionStorage.setItem('aiSidekickContext', contextToSave);
            console.log('Saved context:', contextToSave);
        } catch (error) {
            console.error('Error saving conversation context:', error);
        }
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

    getResponse(input, conversationHistory = []) {
        if (!this.knowledgeBase) {
            return this.getDefaultResponse();
        }

        const lowercaseInput = input.toLowerCase();
        
        // Update conversation context
        this.conversationContext.conversationHistory = conversationHistory;
        
        // Check for context-aware responses first
        const contextResponse = this.getContextAwareResponse(input);
        if (contextResponse) {
            this.conversationContext.lastTopic = this.extractTopicFromResponse(contextResponse);
            this.conversationContext.lastResponse = contextResponse;
            this.saveConversationContext();
            return contextResponse;
        }
        
        // Search through all sections of the knowledge base recursively
        const searchResult = this.searchKnowledgeBase(this.knowledgeBase, lowercaseInput);
        
        if (searchResult) {
            this.conversationContext.lastTopic = this.extractTopicFromResponse(searchResult);
            this.conversationContext.lastResponse = searchResult;
            this.saveConversationContext();
            return searchResult;
        }

        // If no specific match found, return default response
        return this.getDefaultResponse();
    }

    getContextAwareResponse(input) {
        const lowercaseInput = input.toLowerCase();
        
        // Check for context continuation phrases
        const contextPhrases = [
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
        
        const isContextContinuation = contextPhrases.some(phrase => 
            lowercaseInput.includes(phrase)
        );
        
        console.log('Context check:', {
            input: input,
            isContextContinuation: isContextContinuation,
            lastTopic: this.conversationContext.lastTopic,
            lastResponse: this.conversationContext.lastResponse,
            fullContext: this.conversationContext
        });
        
        if (isContextContinuation && this.conversationContext.lastTopic) {
            console.log('Using context-aware response for topic:', this.conversationContext.lastTopic);
            // Get more detailed information about the last topic
            return this.getDetailedResponse(this.conversationContext.lastTopic);
        } else if (isContextContinuation) {
            console.log('Context continuation detected but no last topic found');
        }
        
        return null;
    }

    extractTopicFromResponse(response) {
        // Extract the main topic from a response
        const topics = [
            'northwestern medicine', 'nm scholars', 'ai research workbook',
            'microsoft health', 'bachelors', 'better problems',
            'healthcare', 'ai', 'design', 'strategy', 'leadership'
        ];
        
        const lowercaseResponse = response.toLowerCase();
        console.log('Extracting topic from response:', response);
        
        for (const topic of topics) {
            if (lowercaseResponse.includes(topic)) {
                console.log('Found topic:', topic);
                return topic;
            }
        }
        
        console.log('No topic found in response');
        return null;
    }

    getDetailedResponse(topic) {
        // Provide more detailed information based on the topic
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
        
        return detailedResponses[topic] || this.getDefaultResponse();
    }

    searchKnowledgeBase(data, lowercaseInput) {
        // If this is an object, search through its properties
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                const value = data[key];
                
                // If this property has keywords, check for matches
                if (key === 'keywords' && Array.isArray(value)) {
                    if (value.some(keyword => lowercaseInput.includes(keyword.toLowerCase()))) {
                        // Find the parent object that contains the response
                        return this.findResponseInParent(data);
                    }
                }
                
                // Recursively search nested objects
                const result = this.searchKnowledgeBase(value, lowercaseInput);
                if (result) {
                    return result;
                }
            }
        }
        
        return null;
    }

    findResponseInParent(data) {
        // Look for a response field in the current object or its parent
        if (data.response) {
            return data.response;
        }
        
        if (data.description) {
            return data.description;
        }
        
        // If no direct response, try to construct one from available fields
        if (data.title && data.description) {
            return `${data.title}: ${data.description}`;
        }
        
        return null;
    }

    getDefaultResponse() {
        return "I can help you navigate through Carlos's portfolio and share insights about his process, values, and strategic thinking! Try asking about his projects, experience, AI work, healthcare experience, Northwestern Medicine projects, or dive deeper into his process, values, strategy, collaboration style, or innovation approach. What would you like to explore?";
    }

    setContext(topic, response) {
        this.conversationContext.lastTopic = topic;
        this.conversationContext.lastResponse = response;
        this.saveConversationContext();
        console.log('Context set:', { topic, response });
    }

    testContext() {
        console.log('Testing context functionality...');
        console.log('Current context:', this.conversationContext);
        console.log('SessionStorage context:', sessionStorage.getItem('aiSidekickContext'));
        
        // Test setting context
        this.setContext('test topic', 'test response');
        console.log('Context after setting:', this.conversationContext);
        console.log('SessionStorage after setting:', sessionStorage.getItem('aiSidekickContext'));
        
        // Test loading context
        this.loadConversationContext();
        console.log('Context after loading:', this.conversationContext);
    }
} 
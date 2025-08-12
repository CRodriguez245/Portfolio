class SimpleContextSidekick {
    constructor() {
        this.knowledgeBase = null;
        this.loadKnowledgeBase();
        this.loadContext();
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

    loadContext() {
        try {
            const savedContext = localStorage.getItem('sidekickContext');
            console.log('loadContext called - savedContext from localStorage:', savedContext);
            
            if (savedContext) {
                this.currentContext = JSON.parse(savedContext);
                console.log('Context loaded successfully:', this.currentContext);
            } else {
                this.currentContext = null;
                console.log('No saved context found');
            }
        } catch (error) {
            console.error('Error loading context:', error);
            this.currentContext = null;
        }
    }

    saveContext() {
        try {
            const contextToSave = JSON.stringify(this.currentContext);
            localStorage.setItem('sidekickContext', contextToSave);
            console.log('saveContext called - saved:', contextToSave);
        } catch (error) {
            console.error('Error saving context:', error);
        }
    }

    getResponse(input) {
        const lowercaseInput = input.toLowerCase();
        
        console.log('getResponse called with input:', input);
        console.log('Before loadContext - this.currentContext:', this.currentContext);
        
        // Load context from localStorage on each request
        this.loadContext();
        
        console.log('After loadContext - this.currentContext:', this.currentContext);
        
        // Create debug log
        let debugLog = `=== SIMPLE SIDEKICK DEBUG ===\n`;
        debugLog += `Processing input: ${input}\n`;
        debugLog += `Current context: ${JSON.stringify(this.currentContext)}\n`;

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

        debugLog += `Is context continuation? ${isContextContinuation}\n`;
        debugLog += `Context phrases checked: ${JSON.stringify(contextPhrases)}\n`;
        debugLog += `Lowercase input: ${lowercaseInput}\n`;

        if (isContextContinuation && this.currentContext) {
            console.log('Context continuation detected WITH context:', this.currentContext);
            debugLog += `Using context-aware response for: ${this.currentContext.topic}\n`;
            console.log('Getting detailed response for topic:', this.currentContext.topic);
            const response = this.getDetailedResponse(this.currentContext.topic);
            debugLog += `Context response: ${response}\n`;
            
            // Save debug log to localStorage
            this.saveDebugLog(debugLog);
            console.log(debugLog);
            return response;
        } else if (isContextContinuation && !this.currentContext) {
            console.log('Context continuation detected but NO context!');
            debugLog += `Context continuation detected but no current context!\n`;
            debugLog += `This means the context was lost between requests.\n`;
        } else if (!isContextContinuation) {
            console.log('Not a context continuation phrase');
            debugLog += `Not a context continuation phrase\n`;
        }

        // If not a context continuation, search for new information
        const response = this.searchKnowledgeBase(input);
        debugLog += `Search response: ${response}\n`;
        
        if (response) {
            // Extract topic from response and save context
            const topic = this.extractTopicFromResponse(response);
            debugLog += `Extracted topic: ${topic}\n`;
            if (topic) {
                this.currentContext = { topic: topic, response: response };
                this.saveContext();
                debugLog += `Context saved: ${JSON.stringify(this.currentContext)}\n`;
            }
        }

        const finalResponse = response || this.getDefaultResponse();
        debugLog += `Final response: ${finalResponse}\n`;
        debugLog += `=== END DEBUG ===\n`;
        
        // Save debug log to localStorage
        this.saveDebugLog(debugLog);
        console.log(debugLog);
        return finalResponse;
    }

    saveDebugLog(log) {
        try {
            const existingLogs = localStorage.getItem('sidekickDebugLogs') || '';
            const timestamp = new Date().toISOString();
            const newLog = `[${timestamp}]\n${log}\n\n`;
            localStorage.setItem('sidekickDebugLogs', existingLogs + newLog);
        } catch (error) {
            console.error('Error saving debug log:', error);
        }
    }

    getDebugLogs() {
        try {
            return localStorage.getItem('sidekickDebugLogs') || 'No debug logs found';
        } catch (error) {
            console.error('Error getting debug logs:', error);
            return 'Error retrieving debug logs';
        }
    }

    clearDebugLogs() {
        try {
            localStorage.removeItem('sidekickDebugLogs');
            console.log('Debug logs cleared');
        } catch (error) {
            console.error('Error clearing debug logs:', error);
        }
    }

    searchKnowledgeBase(query) {
        const lowercaseQuery = query.toLowerCase();
        console.log('Searching for query:', query);
        console.log('Lowercase query:', lowercaseQuery);
        
        // Even if knowledgeBase failed to load, we can still search patterns
        
        // Define search patterns and responses
        const searchPatterns = {
            'northwestern': "Carlos has two major projects at Northwestern Medicine. First, the AI Research Workbook - a comprehensive tool for AI research documentation and collaboration. Second, the NM Scholars Program - an innovative educational initiative for medical students. Both projects showcase his ability to bridge AI technology with healthcare needs, focusing on user-centered design and measurable outcomes.",
            'latest project': "Carlos's latest projects are at Northwestern Medicine - the AI Research Workbook and the NM Scholars Program. Both showcase his ability to bridge AI technology with healthcare needs.",
            'recent work': "Carlos's most recent work includes the AI Research Workbook and NM Scholars Program at Northwestern Medicine.",
            'ai research': "The AI Research Workbook is Carlos's comprehensive tool for AI research documentation and collaboration.",
            'nm scholars': "The NM Scholars Program is Carlos's innovative educational initiative at Northwestern Medicine.",
            'healthcare': "Carlos has extensive experience in healthcare technology, working on projects that improve patient care and streamline clinical workflows.",
            'microsoft': "Carlos worked at Microsoft on their healthcare initiatives! He helped design the Bachelors in Microsoft Health program. What's interesting about his approach is how he balanced enterprise constraints with human-centered design - he often talks about 'designing within the system' rather than against it. He learned to navigate complex stakeholder dynamics while maintaining design integrity.",
            'better problems': "Better Problems is Carlos's co-founded company that focuses on solving complex challenges through human-centered design and AI innovation.",
            'grow up': "Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work.",
            'grew up': "Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work.",
            'background': "Carlos's background as a first-generation student and his multicultural upbringing have deeply influenced his approach to design and innovation. He brings a unique perspective to his work, focusing on creating inclusive solutions that serve diverse communities.",
            'where from': "Carlos's multicultural background and experience as a first-generation student have shaped his commitment to equity and inclusion in his design work. His background drives his focus on creating solutions that work for the most vulnerable users first.",
            'childhood': "Carlos's childhood experiences in a multicultural environment and as a first-generation student have profoundly influenced his design philosophy. These early experiences taught him the importance of creating inclusive, accessible solutions that serve diverse communities.",
            'family': "Carlos's family background as a first-generation student has deeply influenced his commitment to equity and inclusion in his work. His family's experiences have shaped his 'equity by design' philosophy.",
            'education': "Carlos's educational journey as a first-generation student has shaped his approach to creating inclusive learning experiences and opportunities for underrepresented groups in technology and healthcare."
        };

        for (const [pattern, response] of Object.entries(searchPatterns)) {
            console.log('Checking pattern:', pattern, 'against query:', lowercaseQuery);
            if (lowercaseQuery.includes(pattern)) {
                console.log('Found match for pattern:', pattern);
                return response;
            }
        }

        console.log('No pattern matches found');
        return null;
    }

    extractTopicFromResponse(response) {
        const lowercaseResponse = response.toLowerCase();
        
        if (lowercaseResponse.includes('northwestern medicine')) return 'northwestern medicine';
        if (lowercaseResponse.includes('ai research workbook')) return 'ai research workbook';
        if (lowercaseResponse.includes('nm scholars')) return 'nm scholars';
        if (lowercaseResponse.includes('microsoft health')) return 'microsoft health';
        if (lowercaseResponse.includes('better problems')) return 'better problems';
        if (lowercaseResponse.includes('healthcare')) return 'healthcare';
        if (lowercaseResponse.includes('grow up') || lowercaseResponse.includes('background') || lowercaseResponse.includes('multicultural') || lowercaseResponse.includes('first-generation')) return 'background';
        if (lowercaseResponse.includes('childhood')) return 'childhood';
        if (lowercaseResponse.includes('family')) return 'family';
        if (lowercaseResponse.includes('education')) return 'education';
        
        return null;
    }

    getDetailedResponse(topic) {
        const detailedResponses = {
            'northwestern medicine': "Carlos's Northwestern Medicine projects are deeply tied to his core values of equity by design and human-centered innovation. The AI Research Workbook embodies his belief that truly inclusive design means building systems that work for the most vulnerable users first, not as an afterthought. His process involves deep stakeholder engagement with communities often left out of innovation conversations. The NM Scholars Program reflects his commitment to democratizing access to AI education and creating opportunities for underrepresented groups in healthcare technology. Both projects showcase his strategic thinking around 'equity by design' - ensuring that AI solutions don't just work for the majority, but are built with and for the communities that need them most.",
            'nm scholars': "The NM Scholars Program is Carlos's innovative educational initiative at Northwestern Medicine. It's designed to enhance medical education through AI-powered learning tools and collaborative platforms. The program focuses on creating engaging learning experiences that help medical students develop critical thinking and research skills.",
            'ai research workbook': "The AI Research Workbook is Carlos's comprehensive tool for AI research documentation and collaboration. It's designed to streamline the research process, making it easier for teams to document findings, share insights, and collaborate effectively. The workbook combines user-friendly design with powerful AI capabilities.",
            'microsoft health': "Carlos's Microsoft Health work exemplifies his strategic approach to enterprise innovation. He designed the Bachelors in Microsoft Health program, demonstrating his ability to balance enterprise constraints with human-centered design principles. His key insight was 'designing within the system' rather than against it - navigating complex stakeholder dynamics while maintaining design integrity. This project showcases his understanding of how to create meaningful change within large organizations, working with existing structures to deliver user-centered solutions that meet both business and human needs. His approach involved deep stakeholder engagement, iterative design processes, and a focus on measurable outcomes that served both the organization and end users.",
            'better problems': "Better Problems is Carlos's co-founded company that focuses on solving complex challenges through human-centered design and AI innovation. The company works on projects that require deep understanding of user needs, business constraints, and technological possibilities.",
            'healthcare': "Carlos has extensive experience in healthcare technology, working on projects that improve patient care, streamline clinical workflows, and enhance provider-patient communication. His approach combines AI innovation with deep understanding of healthcare needs.",
            'background': "Carlos's background as a first-generation student and his multicultural upbringing have profoundly shaped his approach to design and innovation. Growing up in a diverse environment taught him the importance of creating solutions that work for everyone, not just the majority. His family's experiences navigating systems not designed for them inspired his 'equity by design' philosophy. This background drives his commitment to creating opportunities for underrepresented groups in technology and healthcare, ensuring that innovation serves the communities that need it most.",
            'grow up': "Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work.",
            'childhood': "Carlos's childhood experiences in a multicultural environment and as a first-generation student have profoundly influenced his design philosophy. These early experiences taught him the importance of creating inclusive, accessible solutions that serve diverse communities.",
            'family': "Carlos's family background as a first-generation student has deeply influenced his commitment to equity and inclusion in his work. His family's experiences have shaped his 'equity by design' philosophy.",
            'education': "Carlos's educational journey as a first-generation student has shaped his approach to creating inclusive learning experiences and opportunities for underrepresented groups in technology and healthcare."
        };

        return detailedResponses[topic] || this.getDefaultResponse();
    }

    getDefaultResponse() {
        return "I can help you navigate through Carlos's portfolio and share insights about his process, values, and strategic thinking! Try asking about his projects, experience, AI work, healthcare experience, Northwestern Medicine projects, or dive deeper into his process, values, strategy, collaboration style, or innovation approach. What would you like to explore?";
    }

    setContext(topic, response) {
        this.currentContext = { topic: topic, response: response };
        this.saveContext();
        console.log('Context set:', this.currentContext);
    }

    clearContext() {
        this.currentContext = null;
        localStorage.removeItem('sidekickContext');
        console.log('Context cleared');
    }

    // Force clear localStorage context (for debugging)
    forceClearContext() {
        try {
            console.log('forceClearContext called - clearing context');
            localStorage.removeItem('sidekickContext');
            this.currentContext = null;
            console.log('Force cleared context from localStorage');
        } catch (error) {
            console.error('Error force clearing context:', error);
        }
    }

    // Get current context (for debugging)
    getContext() {
        return {
            currentContext: this.currentContext,
            localStorageContext: localStorage.getItem('sidekickContext'),
            parsedLocalStorage: (() => {
                try {
                    const saved = localStorage.getItem('sidekickContext');
                    return saved ? JSON.parse(saved) : null;
                } catch (error) {
                    return `Error parsing: ${error}`;
                }
            })()
        };
    }
} 
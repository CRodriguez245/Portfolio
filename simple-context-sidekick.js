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
            'beyond behavioral benchmarks': "Absolutely, this is one of Carlos's core AI systems research projects. Beyond Behavioral Benchmarks tests whether language models' internal demographic representations actually drive outputs. The key finding is dissociation: models can look fair behaviorally while still encoding demographic information internally in ways behavioral benchmarks miss. Ask me about activation probing, causal patching, or why this matters for silicon sampling.",
            'bbb': "BBB stands for Beyond Behavioral Benchmarks, Carlos's mechanistic interpretability project on demographic encoding in language models. It combines behavioral baselines, activation probing, causal patching, and semantic characterization to test what models encode versus what they express. Want the short version of findings or the methodological pipeline?",
            'mechanistic interpretability': "Great question. Carlos's mechanistic interpretability work asks what language models are computing internally, not just what they output. In Beyond Behavioral Benchmarks, he shows geometric encoding, causal activity, and behavioral expression are distinct properties that can diverge. I can break down each phase if you'd like.",
            'representational fidelity': "Representational fidelity is the core thread of Carlos's AI systems research: whether AI systems accurately encode, reflect, and serve the humans they claim to represent. His BBB project shows why output-only fairness checks can be insufficient without mechanistic auditing.",
            'demographic encoding': "Carlos studied demographic encoding in Beyond Behavioral Benchmarks. Across multiple open-weight models, linear probes recovered demographic identity from activations with near-perfect accuracy, but causal patching showed whether those encodings actually influenced outputs depended on model/training regime.",
            'silicon sampling': "Carlos's BBB paper evaluates a key assumption behind silicon sampling: that simulated demographic outputs reflect internal demographic reasoning. The project finds this assumption can fail, because internal representation and behavioral expression can be decoupled.",
            'causal patching': "In Carlos's BBB project, causal patching swaps demographic directions in the residual stream to test whether encoded identity is causally active for outputs. This helps separate 'present in representation' from 'actually driving behavior.'",
            'activation probing': "Activation probing in BBB tests whether demographic identity is encoded in model activations. Carlos uses probing as one layer of evidence, then pairs it with causal patching to avoid over-interpreting probe-only results.",
            'ai systems research': "Carlos has pivoted toward AI systems research, with emphasis on representational fidelity and evaluation integrity. Two anchor projects are Beyond Behavioral Benchmarks (mechanistic auditing) and Decision Coach (evaluation-centered applied LLM system design).",
            'decision coach': "Decision Coach is Carlos's applied AI systems project at DEF at Stanford. It combines a coaching persona that avoids answering for users with a six-dimension decision-quality rubric scored turn by turn by an LLM judge. In a pilot, most sessions improved within-session decision quality.",
            'researchbridge': "Great question! ResearchBridge is honestly one of Carlos's most impressive projects! It started as an AI workbook but grew into this comprehensive multi-modal research companion. The coolest part is how it serves both students and instructors - students get scaffolds that boost their confidence and curiosity, while instructors get visibility into engagement patterns. The results speak for themselves: 3× improvement in insight quality and 95% confidence gains! Feel free to ask me more about this!",
            'northwestern': "Absolutely! Carlos has two really impactful projects at Northwestern Medicine! First, there's ResearchBridge - his multi-modal research companion that helps first-generation students build confidence in research. Then there's the NM Scholars Program, where he redesigned how cohorts work by focusing on identity resonance rather than just age or grade. Both projects show his knack for making complex systems more equitable and human-centered. What else would you like to know?",
            'latest project': "Sure thing! Carlos's latest projects are at Northwestern Medicine - ResearchBridge and the NM Scholars Program. Both showcase his ability to bridge AI technology with healthcare needs while focusing on equity and inclusion. I can dive deeper into any aspect you're curious about!",
            'recent work': "Here's what I can share about Carlos's most recent work! He's been focused on ResearchBridge and the NM Scholars Program at Northwestern Medicine, both of which demonstrate his commitment to making technology more accessible and equitable. Let me know if you want more details on this!",
            'ai research': "That's a great topic! ResearchBridge is Carlos's comprehensive multi-modal research companion that helps first-generation students build confidence in research. It's designed to make academic research less intimidating and more equitable. Happy to elaborate on any part of this!",
            'nm scholars': "The NM Scholars Program is such a cool project! Carlos completely reimagined how cohorts work - instead of grouping students by age or grade, he organized them by identity resonance. He also formalized APC roles to create student-led engagement. The key insight? Confidence, not research ability, was the strongest predictor of engagement. Once students felt they belonged, everything changed! What else would you like to know?",
            'healthcare': "Carlos has such interesting experience in healthcare technology! His approach always combines AI innovation with deep understanding of healthcare needs. Whether it's making research more accessible for students or helping experts share their knowledge, he focuses on building confidence and equity into the system. I can dive deeper into any aspect you're curious about!",
            'microsoft': "Carlos's work at Microsoft Health was really fascinating! He helped design the Bachelors in Microsoft Health program and discovered something crucial - internal education is often more about cultural permission than curriculum. Many experts needed validation that their tacit knowledge mattered. This insight shaped his product strategy to focus on building confidence and recognition rather than just delivering content. Feel free to ask me more about this!",
            'better problems': "Better Problems is such a thoughtful project! It's Carlos's independent practice focused on reframing problems rather than rushing to solutions. He combines essays with strategy work for mission-aligned teams navigating complexity. The tone is intentional, critical, and curious - meant to provoke reflection, not just agreement. Let me know if you want more details on this!",
            'epicac': "EPICAC is such a creative project! It's this interactive installation where a Raspberry Pi and Epson thermal printer generate and print original love poems in real time. It's a reinterpretation of Kurt Vonnegut's EPICAC exploring emotional AI, disposable intimacy, and literary HCI. The printer actually hums softly - it's designed to feel like early terminals! Happy to elaborate on any part of this!",
            'gavno': "GA.V.NO is a unique project that shows Carlos's creative side! It's a storytelling platform exploring Brazilian music, culture, and design. It lives between studio and sound booth - part mixtape, part design reflection - tying rhythms and identity to modular product concepts. It's all about music as method and cultural storytelling. What else would you like to know?",
            'grow up': "Great question! Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work. I can dive deeper into any aspect you're curious about!",
            'grew up': "Absolutely! Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work. Feel free to ask me more about this!",
            'background': "Here's what I can share about Carlos's background! As a first-generation student with a multicultural upbringing, he brings a unique perspective to his work, focusing on creating inclusive solutions that serve diverse communities. His background drives his 'equity by design' philosophy. Let me know if you want more details on this!",
            'where from': "That's a great topic! Carlos's multicultural background and experience as a first-generation student have shaped his commitment to equity and inclusion in his design work. His background drives his focus on creating solutions that work for the most vulnerable users first. Happy to elaborate on any part of this!",
            'childhood': "Sure thing! Carlos's childhood experiences in a multicultural environment and as a first-generation student have profoundly influenced his design philosophy. These early experiences taught him the importance of creating inclusive, accessible solutions that serve diverse communities. What else would you like to know?",
            'family': "I'd love to tell you about this! Carlos's family background as a first-generation student has deeply influenced his commitment to equity and inclusion in his work. His family's experiences have shaped his 'equity by design' philosophy. I can dive deeper into any aspect you're curious about!",
            'education': "Great question! Carlos's educational journey as a first-generation student has shaped his approach to creating inclusive learning experiences and opportunities for underrepresented groups in technology and healthcare. Feel free to ask me more about this!"
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
        if (lowercaseResponse.includes('beyond behavioral benchmarks') || lowercaseResponse.includes('bbb')) return 'beyond behavioral benchmarks';
        if (lowercaseResponse.includes('mechanistic interpretability') || lowercaseResponse.includes('representational fidelity')) return 'ai systems research';
        if (lowercaseResponse.includes('decision coach')) return 'decision coach';
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
            'beyond behavioral benchmarks': "Beyond Behavioral Benchmarks is Carlos's mechanistic interpretability project on demographic encoding in language models. The headline result: behavioral outputs and internal representations can be decoupled. A model can pass fairness benchmarks while still encoding demographic information internally in ways those benchmarks cannot detect. The pipeline combines behavioral baseline, activation probing, causal patching, and semantic characterization to test not just what models say, but what they compute.",
            'ai systems research': "Carlos's AI systems research centers on representational fidelity, whether systems accurately encode, reflect, and serve the humans they claim to represent. His work spans mechanistic auditing (Beyond Behavioral Benchmarks) and applied evaluation-centric system design (Decision Coach). A recurring point in his research is that geometry, causality, and behavior are related but not interchangeable signals.",
            'decision coach': "Decision Coach is an applied AI system Carlos designed with DEF at Stanford. It uses a coaching persona designed not to answer for the user, plus a six-dimension rubric with turn-level scoring. The system architecture separates coaching from judging to reduce reward hacking and improve interpretability of progress signals.",
            'northwestern medicine': "Carlos's Northwestern Medicine projects are honestly so inspiring! They're deeply tied to his core values of equity by design and human-centered innovation. ResearchBridge embodies his belief that truly inclusive design means building systems that work for the most vulnerable users first, not as an afterthought. His process involves deep stakeholder engagement with communities often left out of innovation conversations. The NM Scholars Program reflects his commitment to democratizing access to AI education and creating opportunities for underrepresented groups in healthcare technology. Both projects showcase his strategic thinking around 'equity by design' - ensuring that AI solutions don't just work for the majority, but are built with and for the communities that need them most. What else would you like to know?",
            'nm scholars': "The NM Scholars Program is such a cool project! Carlos completely reimagined how cohorts work - instead of grouping students by age or grade, he organized them by identity resonance. He also formalized APC roles to create student-led engagement. The key insight? Confidence, not research ability, was the strongest predictor of engagement. Once students felt they belonged, everything changed! It's designed to enhance medical education through AI-powered learning tools and collaborative platforms. I can dive deeper into any aspect you're curious about!",
            'researchbridge': "ResearchBridge is honestly one of Carlos's most impressive projects! It started as an AI workbook but grew into this comprehensive multi-modal research companion. The coolest part is how it serves both students and instructors - students get scaffolds that boost their confidence and curiosity, while instructors get visibility into engagement patterns. The results speak for themselves: 3× improvement in insight quality and 95% confidence gains! Feel free to ask me more about this!",
            'microsoft health': "Carlos's Microsoft Health work was really fascinating! He designed the Bachelors in Microsoft Health program and discovered something crucial - internal education is often more about cultural permission than curriculum. Many experts needed validation that their tacit knowledge mattered. This insight shaped his product strategy to focus on building confidence and recognition rather than just delivering content. His key insight was 'designing within the system' rather than against it - navigating complex stakeholder dynamics while maintaining design integrity. Let me know if you want more details on this!",
            'better problems': "Better Problems is such a thoughtful project! It's Carlos's independent practice focused on reframing problems rather than rushing to solutions. He combines essays with strategy work for mission-aligned teams navigating complexity. The tone is intentional, critical, and curious - meant to provoke reflection, not just agreement. Happy to elaborate on any part of this!",
            'healthcare': "Carlos has such interesting experience in healthcare technology! His approach always combines AI innovation with deep understanding of healthcare needs. Whether it's making research more accessible for students or helping experts share their knowledge, he focuses on building confidence and equity into the system. I can dive deeper into any aspect you're curious about!",
            'background': "Carlos's background is so inspiring! As a first-generation student with a multicultural upbringing, he brings such a unique perspective to his work. Growing up in a diverse environment taught him the importance of creating solutions that work for everyone, not just the majority. His family's experiences navigating systems not designed for them inspired his 'equity by design' philosophy. This background drives his commitment to creating opportunities for underrepresented groups in technology and healthcare. What else would you like to know?",
            'grow up': "Great question! Carlos grew up in a multicultural environment that shaped his perspective on inclusive design and equity. His background as a first-generation student influenced his commitment to creating opportunities for underrepresented groups in technology and healthcare. This early experience drives his 'equity by design' philosophy in all his work. Feel free to ask me more about this!",
            'childhood': "Sure thing! Carlos's childhood experiences in a multicultural environment and as a first-generation student have profoundly influenced his design philosophy. These early experiences taught him the importance of creating inclusive, accessible solutions that serve diverse communities. I can dive deeper into any aspect you're curious about!",
            'family': "I'd love to tell you about this! Carlos's family background as a first-generation student has deeply influenced his commitment to equity and inclusion in his work. His family's experiences have shaped his 'equity by design' philosophy. Let me know if you want more details on this!",
            'education': "Great question! Carlos's educational journey as a first-generation student has shaped his approach to creating inclusive learning experiences and opportunities for underrepresented groups in technology and healthcare. Happy to elaborate on any part of this!"
        };

        return detailedResponses[topic] || this.getDefaultResponse();
    }

    getDefaultResponse() {
        const responses = [
            "Hey there! I can help you explore Carlos's AI systems research and project portfolio. Ask about Beyond Behavioral Benchmarks, Decision Coach, representational fidelity, or his healthcare and education work.",
            "Hi! Ask me about Carlos's recent work in mechanistic interpretability, AI evaluation, and applied systems design, including BBB and Decision Coach.",
            "Hello! I can walk you through Carlos's projects, experience, and research themes. Try asking about BBB, mechanistic interpretability, or his role in AI strategy and research.",
            "Hey! I can share insights on Carlos's portfolio, from representational fidelity research to real-world AI systems in healthcare and education. What do you want to dive into?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
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
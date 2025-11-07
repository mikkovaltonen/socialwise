import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
// Using OpenRouter API instead of Google Generative AI
type Part = { text: string };
import { Loader2, Send, RotateCcw, Paperclip, Bot, LogOut, Settings, ThumbsUp, ThumbsDown, AlertTriangle, RefreshCw, Upload, FileSpreadsheet, Package } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loadLatestPrompt, createContinuousImprovementSession, addTechnicalLog, setUserFeedback } from '../lib/firestoreService';
import { sessionService, ChatSession } from '../lib/sessionService';
import * as XLSX from 'xlsx';
import { getSystemPromptForUser, getUserLLMModel } from '../lib/systemPromptService';
import { useQueryClient } from '@tanstack/react-query';
import { InteractiveJsonTable } from './InteractiveJsonTable';
import { MrpDecisionTable } from './MrpDecisionTable';
import FunctionUsageIndicator from './FunctionUsageIndicator';
import { SubstrateFamilySelector } from './SubstrateFamilySelector';

interface MarketingPlannerChatProps {
  onLogout?: () => void;
  leftPanel?: React.ReactNode;
  leftPanelVisible?: boolean;
  chatVisible?: boolean;
  onChatVisibleChange?: (visible: boolean) => void;
  topRightControls?: React.ReactNode;
}

export interface MarketingPlannerChatRef {
  loadSubstrateFamily: (keyword: string, records: any[]) => Promise<void>;
}

const openRouterApiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY || '';

// Legacy code removed - this is now a CRM mass marketing application
// No supplier search or purchase requisition functionality

// Version and configuration logging
console.log('🔧 MarketingPlannerChat v3.8-fixed-aiRequestId - Fixed undefined aiRequestId in catch blocks:', {
  version: '2.1-debug-functions',
  changes: 'Added extensive debugging to track function knowledge source',
  date: '2025-09-29',
  author: 'Claude',
  debug: 'Check console for TOOLS DEBUG, SYSTEM PROMPT DEBUG, and OPENROUTER API CALL DEBUG'
});

// Debug: Log OpenRouter API config
console.log('OpenRouter API config:', {
  apiKey: openRouterApiKey ? `${openRouterApiKey.substring(0, 10)}...` : 'undefined',
  model: 'x-ai/grok-4-fast (default)',  // Will be dynamically selected based on user preference
  temperature: 0,  // Deterministic mode for procurement use case
  timestamp: new Date().toISOString(),
  toolSupport: true
});

interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  title?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  citationMetadata?: {
    citationSources: CitationSource[];
  };
  functionsUsed?: {
    searchSupplier?: boolean;
    createPurchaseRequisition?: boolean;
  };
}

const processTextWithCitations = (text: string, citationSources?: CitationSource[]) => {
  // Remove time portion from ISO datetime strings (e.g., "2025-12-02T00:00:00" -> "2025-12-02")
  let processedText = text.replace(/(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(\.\d+)?/g, '$1');

  const originalText = processedText;
  const formattedSources: string[] = [];

  if (citationSources && citationSources.length > 0) {
    const uniqueUris = new Set<string>();
    let sourceNumber = 1;
    citationSources.forEach((source) => {
      if (source.uri && !uniqueUris.has(source.uri)) {
        const linkDescription = source.title && source.title.trim() !== '' ? source.title : source.uri;
        formattedSources.push(`[Source ${sourceNumber}: ${linkDescription}](${source.uri})`);
        uniqueUris.add(source.uri);
        sourceNumber++;
      }
    });
  }

  return { originalText, formattedSources };
};

const MarketingPlannerChat = forwardRef<MarketingPlannerChatRef, MarketingPlannerChatProps>(({ onLogout, leftPanel, leftPanelVisible = false, chatVisible = true, onChatVisibleChange, topRightControls }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const [substrateData, setSubstrateData] = useState<any>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const hasReceivedResponseRef = useRef<boolean>(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Continuous improvement tracking
  const [continuousImprovementSessionId, setContinuousImprovementSessionId] = useState<string | null>(null);
  const [chatSessionKey] = useState<string>(() => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  const [currentPromptKey, setCurrentPromptKey] = useState<string | null>(null);
  
  // Feedback dialog
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [pendingMessageIndex, setPendingMessageIndex] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // System initialization status
  const [statusLoading, setStatusLoading] = useState(false);
  const [initStatus, setInitStatus] = useState<{ hasPrompt: boolean; knowledgeCount: number; erpCount: number }>({
    hasPrompt: true, // Default to true to allow chat input
    knowledgeCount: 0,
    erpCount: 0
  });

  // Expose methods via ref for external components
  useImperativeHandle(ref, () => ({
    loadSubstrateFamily: async (keyword: string, records: any[]) => {
      await handleSubstrateFamilySelected(keyword, records);
    }
  }));

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      setStatusLoading(true);
      try {
        const [systemPrompt, knowledge, erp] = await Promise.all([
          getSystemPromptForUser(user),
          storageService.getUserDocuments(user.uid).catch(() => []),
          storageService.getUserERPDocuments(user.uid).catch(() => [])
        ]);
        setInitStatus({
          hasPrompt: !!systemPrompt,
          knowledgeCount: Array.isArray(knowledge) ? knowledge.length : 0,
          erpCount: Array.isArray(erp) ? erp.length : 0
        });
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [user]);

  // Initialize chat session with context - ONLY when Excel is uploaded or user manually starts
  React.useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    console.log('🔄 COMPONENT MOUNTED - Checking session state');
    console.log('Current messages count:', messages.length);
    console.log('Session active:', sessionActive);
    console.log('Substrate data loaded:', !!substrateData);

    const initializeSession = async () => {
      if (!mounted) return;

      // Check if we already have a session ID to prevent duplicate init
      if (sessionIdRef.current) {
        console.log('✋ Session already initialized with ID:', sessionIdRef.current);
        return;
      }

      // Don't auto-initialize if no substrate data - wait for user to select
      if (!substrateData) {
        console.log('⏸️ Waiting for substrate family selection before initializing chat');
        // Show selection prompt message
        if (messages.length === 0) {
          const promptMessage: Message = {
            role: 'model',
            parts: [{
              text: `👋 Welcome to the Stock Management Assistant!\n\n**Please select a substrate family** from the dropdown below to begin.\n\nOnce you select a family, I'll help you make correct purchase/transfer wait decision for that substrate family.`
            }]
          };
          setMessages([promptMessage]);
        }
        return;
      }

      if (!sessionActive && user && !sessionInitializing && substrateData) {
        // Substrate data is already loaded, session will be initialized by initializeChatWithSubstrateContext
        console.log('📊 Substrate data exists, session should be initialized via initializeChatWithSubstrateContext');
        return;
      }
    };

    // Add slight delay to avoid rapid re-initialization
    initializationTimeout = setTimeout(() => {
      if (mounted) {
        initializeSession();
      }
    }, 100);

    // Cleanup function
    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      console.log('🔚 Component unmounting - cleanup performed');
    };
  }, [sessionActive, user, substrateData]); // Added substrateData to deps

  // Reset session when user changes
  React.useEffect(() => {
    return () => {
      sessionIdRef.current = null;
    };
  }, [user]);


  const handleSendMessage = async (messageText?: string, hideFromUI: boolean = false, customSession?: ChatSession) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    // Timeout helper with AbortController
    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 30000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs / 1000} seconds. Please try again.`);
        }
        throw error;
      }
    };

    // OpenRouter API helper function with retry logic
    const callOpenRouterAPI = async (messages: any[], systemPrompt: string, tools?: any[], retryCount: number = 0) => {
      // Get user's selected model
      const selectedModel = user ? await getUserLLMModel(user.uid) : 'google/gemini-2.5-pro';

      // DEBUG: Log what's being sent to OpenRouter
      console.log('🚀 OPENROUTER API CALL DEBUG:', {
        model: selectedModel,
        hasTools: !!tools,
        toolCount: tools?.length || 0,
        toolNames: tools?.map(t => t.function?.name || 'unknown') || [],
        systemPromptLength: systemPrompt.length
      });
      const maxRetries = 2;

      try {
        const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin || 'https://valmet-buyer.firebaseapp.com',
            'X-Title': 'Professional Demand Manager'
          },
          body: JSON.stringify((() => {
            const requestBody = {
              model: selectedModel,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((msg: any) => ({
                  role: msg.role === 'model' ? 'assistant' : msg.role,
                  content: typeof msg.parts[0] === 'object' ? msg.parts[0].text : msg.parts[0]
                }))
              ],
              temperature: 0,
              ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {})
            };

            // CRITICAL DEBUG: Log EXACTLY what we're sending
            console.log('🔴 EXACT API REQUEST BODY:', {
              toolsInRequest: requestBody.tools?.map((t: any) => t.function?.name) || 'NO TOOLS',
              systemPromptContainsInvoice: systemPrompt.toLowerCase().includes('invoice'),
              systemPromptContainsContract: systemPrompt.toLowerCase().includes('contract'),
              systemPromptContains2023: systemPrompt.toLowerCase().includes('2023'),
              systemPromptContainsTraining: systemPrompt.toLowerCase().includes('training'),
              systemPromptLength: systemPrompt.length,
              messagesCount: requestBody.messages.length,
              historyMessages: messages.length,
              isFirstMessage: messages.length === 0,
              messageRoles: requestBody.messages.map((m: any) => m.role),
              // Log first 2000 chars to see what's actually in the prompt
              systemPromptPreview: systemPrompt.substring(0, 2000),
              fullRequestBody: JSON.stringify(requestBody).substring(0, 1000)
            });

            return requestBody;
          })())
        }, 30000); // 30 second timeout

        if (!response.ok) {
          let errorMessage = '';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData);
          } catch {
            errorMessage = await response.text();
          }

          // Retry on 503 or 429 errors
          if ((response.status === 503 || response.status === 429) && retryCount < maxRetries) {
            console.log(`Retrying API call (attempt ${retryCount + 2}/${maxRetries + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
            return callOpenRouterAPI(messages, systemPrompt, tools, retryCount + 1);
          }

          throw new Error(`OpenRouter API error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
          console.error('Invalid API response structure:', data);
          throw new Error('Invalid response from AI service. Please try again.');
        }

        return data;
      } catch (error: any) {
        // Retry on network errors if we haven't exceeded retry limit
        if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
          console.log(`Network error, retrying (attempt ${retryCount + 2}/${maxRetries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return callOpenRouterAPI(messages, systemPrompt, tools, retryCount + 1);
        }
        throw error;
      }
    };

    // System prompt check removed - default prompt is always available

    // Initialize continuous improvement if not already done
    if (!continuousImprovementSessionId) {
      await initializeContinuousImprovement();
    }

    // Only add user message to UI if not hidden
    if (!hideFromUI) {
      const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
      setMessages(prev => [...prev, userMessage]);
    }
    if (!messageText) setInput('');
    setIsLoading(true);

    // Reset the response flag for new message
    hasReceivedResponseRef.current = false;

    // Auto-reset loading state after 45 seconds as failsafe
    let loadingTimeoutId = setTimeout(() => {
      // Only show error if we're still loading and haven't received a response
      setIsLoading(currentLoading => {
        if (currentLoading && !hasReceivedResponseRef.current) {
          console.warn('Message processing timeout - showing temporary warning');

          // Log timeout error
          if (continuousImprovementSessionId) {
            addTechnicalLog(continuousImprovementSessionId, {
              event: 'error_occurred',
              errorType: 'response_timeout',
              userMessage: textToSend,
              timeoutAfterMs: 45000,
              timestamp: new Date().toISOString()
            });
          }

          // Add timeout message with a unique identifier so we can remove it later
          const timeoutMessageId = `timeout-${Date.now()}`;
          setMessages(prev => [...prev, {
            role: 'model',
            parts: [{ text: '⚠️ Response timeout. The request is still processing...' }],
            id: timeoutMessageId
          }]);

          // Store the timeout message ID so we can remove it if response arrives
          (window as any).__timeoutMessageId = timeoutMessageId;
        } else {
          console.log('Timeout reached but response already received - suppressing error message');
        }
        return false;
      });
    }, 45000);
    
    // Log user message
    if (continuousImprovementSessionId) {
      await addTechnicalLog(continuousImprovementSessionId, {
        event: 'user_message',
        userMessage: textToSend
      });
    }

    try {
      // Use session context if available, otherwise fallback to loading prompt
      let systemPrompt = '';

      // Use custom session if provided (for substrate context initialization), otherwise use state
      const activeSession = customSession || chatSession;

      if (activeSession) {
        // Use the full context from initialized session (system prompt + knowledge documents)
        console.log('📦 USING CHAT SESSION FULL CONTEXT', {
          sessionId: activeSession.sessionId,
          createdAt: activeSession.createdAt,
          age: new Date().getTime() - new Date(activeSession.createdAt).getTime(),
          ageInMinutes: Math.floor((new Date().getTime() - new Date(activeSession.createdAt).getTime()) / 60000),
          systemPromptLength: activeSession.systemPrompt?.length,
          fullContextLength: activeSession.fullContext?.length
        });

        // LOG THE COMPLETE FULL CONTEXT
        console.log('🔍 FULL CONTEXT BEING SENT (COMPLETE):', activeSession.fullContext);

        systemPrompt = activeSession.fullContext;
      } else {
        // Try to load versioned prompt for this user
        try {
          const versionedPrompt = await getSystemPromptForUser(user);
          if (versionedPrompt) {
            console.log('✅ USING VERSIONED PROMPT (production/testing)');
            console.log('🔍 VERSIONED PROMPT COMPLETE:', versionedPrompt);
            systemPrompt = versionedPrompt;
          }
        } catch (error) {
          console.error('Error loading versioned prompt:', error);

          // Fallback: try to load latest prompt for this user (legacy)
          if (user?.uid) {
            try {
              const latestPrompt = await loadLatestPrompt(user.uid);
              if (latestPrompt) {
                console.warn('⚠️ USING LEGACY PROMPT FROM FIRESTORE - MAY CONTAIN OLD DATA');
                console.log('Legacy prompt preview:', latestPrompt.substring(0, 200));
                // Check if it contains old functions
                if (latestPrompt.includes('Training Invoices') || latestPrompt.includes('iPRO')) {
                  console.error('🚨 LEGACY PROMPT CONTAINS REMOVED FUNCTIONS - NOT USING IT');
                  // Don't use this prompt
                } else {
                  systemPrompt = latestPrompt;
                }
              }
            } catch (error) {
              console.error('Error loading latest prompt:', error);
            }
          }
        }

        // No fallback - if no prompt available, show error
        if (!systemPrompt) {
          throw new Error('No system prompt configured. Please visit Admin panel to set up your prompt.');
        }
      }

      // No function tools for CRM mass marketing chat - just conversational AI
      const openRouterTools: any[] = [];

      // DEBUG: Log tools being sent to OpenRouter
      console.log('🔍 TOOLS DEBUG - Functions sent to OpenRouter:', {
        sessionId: chatSession?.sessionId || 'NO_SESSION',
        count: openRouterTools.length,
        functions: openRouterTools.map(t => t.function.name),
        fullTools: openRouterTools
      });

      // Add current message to history for OpenRouter
      const messagesWithCurrent = [...messages, { role: 'user', parts: [{ text: textToSend }] }];

      // DEBUG: Log system prompt content
      console.log('📝 SYSTEM PROMPT DEBUG:', {
        length: systemPrompt.length,
        first500Chars: systemPrompt.substring(0, 500),
        includesInvoice: systemPrompt.includes('invoice'),
        includesContract: systemPrompt.includes('contract'),
        includesTraining2023: systemPrompt.includes('training_2023')
      });

      const result = await callOpenRouterAPI(messagesWithCurrent, systemPrompt, openRouterTools);
      console.log('OpenRouter response structure:', {
        hasChoices: !!result?.choices,
        hasToolCalls: !!result?.choices?.[0]?.message?.tool_calls,
        toolCallsCount: result?.choices?.[0]?.message?.tool_calls?.length || 0
      });

      if (result && result.choices && result.choices.length > 0) {
        const choice = result.choices[0];
        const content = choice.message;

        // Check for function calls (OpenRouter format)
        if (content?.tool_calls && content.tool_calls.length > 0) {
          console.log('Tool calls detected:', content.tool_calls);
          for (const toolCall of content.tool_calls) {
            if (toolCall.function) {
              const functionName = toolCall.function.name;
              const functionArgs = typeof toolCall.function.arguments === 'string'
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments;
              
              // Handle different function calls
              // Legacy supplier search removed - this is now a CRM mass marketing application
            }
          }
        } else {
          // No tool calls - regular text response
          const aiResponseText = content?.content;

          // Validate we have actual content
          if (!aiResponseText || aiResponseText === "No response text") {
            console.error('Empty or invalid response from AI');
            throw new Error('Received empty response from AI service. Please try again.');
          }

          console.log('Regular text response:', aiResponseText.substring(0, 100));

          if (continuousImprovementSessionId) {
            await addTechnicalLog(continuousImprovementSessionId, {
              event: 'ai_response',
              aiResponse: aiResponseText.substring(0, 500) // First 500 chars to avoid too much data
            });
          }

          hasReceivedResponseRef.current = true; // Mark that we've received a response

          // Remove timeout message if it exists
          const timeoutMsgId = (window as any).__timeoutMessageId;
          if (timeoutMsgId) {
            setMessages(prev => prev.filter(msg => (msg as any).id !== timeoutMsgId));
            delete (window as any).__timeoutMessageId;
            console.log('✅ Removed timeout message - response received successfully');
          }

          setMessages(prev => [...prev, {
            role: 'model',
            parts: [{ text: aiResponseText }],
            citationMetadata: undefined,  // OpenRouter doesn't provide citations
            functionsUsed: undefined
          }]);
        }
      } else {
        console.error('Invalid response structure from OpenRouter:', result);
        throw new Error('Invalid response structure from AI service. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Log critical error
      console.error('Chat message send failed', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error),
        userId: user?.uid,
        chatSessionKey,
        sessionId: continuousImprovementSessionId,
        model: user ? await getUserLLMModel(user.uid) : 'google/gemini-2.5-flash',
        messageText: textToSend.slice(0, 100) // First 100 chars only for privacy
      });

      // Provide more detailed error message to user
      let errorMessage = "Error processing your request. ";

      if (error instanceof Error) {
        if (error.message.includes('overloaded') || error.message.includes('503')) {
          errorMessage = "The AI service is temporarily overloaded. Please wait a moment and try again.";
        } else if (error.message.includes('402')) {
          errorMessage = "OpenRouter API credits exhausted. Please check your account balance.";
        } else if (error.message.includes('401')) {
          errorMessage = "OpenRouter authentication failed. Please check your API key.";
        } else if (error.message.includes('API key')) {
          errorMessage = "There's an issue with the API configuration. Please contact support.";
        } else if (error.message.includes('429')) {
          errorMessage = "Too many requests. Please wait a moment before trying again.";
        } else {
          errorMessage = `Error: ${error.message}. Please try again.`;
        }
      }

      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: errorMessage }]
      }]);
    } finally {
      setIsLoading(false);
      // Clear the loading timeout if it exists
      if (typeof loadingTimeoutId !== 'undefined') {
        clearTimeout(loadingTimeoutId);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = async () => {
    setMessages([]);
    setSessionActive(false);
    setChatSession(null);
    setInput('');
    toast.success('Chat reset successfully');
    
    // Reinitialize session with fresh context
    if (user) {
      setSessionInitializing(true);
      try {
        const session = await sessionService.initializeChatSession(user.uid);
        setChatSession(session);
        toast.success('Session refreshed with latest knowledge base');
      } catch (error) {
        console.error('Failed to refresh session:', error);
      } finally {
        setSessionInitializing(false);
      }
    }
  };

  const handleAttachDocuments = () => {
    navigate('/admin');
  };

  const handleOpenAdmin = () => {
    navigate('/admin');
  };

  // Handle substrate family selection for stock management
  const handleSubstrateFamilySelected = async (keyword: string, records: any[]) => {
    setSelectedKeyword(keyword);

    // Store the substrate data
    const substrateContent = {
      keyword: keyword,
      data: records,
      recordCount: records.length,
      loadedAt: new Date().toISOString()
    };

    setSubstrateData(substrateContent);

    console.log('📊 Substrate family loaded:', {
      keyword: keyword,
      records: records.length,
      firstRecord: records[0]
    });

    // Initialize chat with substrate context
    await initializeChatWithSubstrateContext(substrateContent);
  };

  // Initialize chat with Substrate Family context
  const initializeChatWithSubstrateContext = async (substrateContent: any) => {
    if (!user) return;

    setSessionInitializing(true);
    try {
      // Get user's name from email (part before @)
      const userName = user.email?.split('@')[0] || 'User';

      // Create context with user info and JSON data
      const substrateContext = `User: ${userName}\n\nSubstrate Family: ${substrateContent.keyword}\n\n\`\`\`json
${JSON.stringify(substrateContent.data, null, 2)}
\`\`\``;

      // Initialize session with substrate context
      const session = await sessionService.initializeChatSession(user.uid);

      // Append substrate context to the session
      if (session) {
        const originalContextLength = session.fullContext.length;
        session.fullContext = session.fullContext + '\n\n' + substrateContext;
        setChatSession(session);

        console.log('✅ Chat initialized with substrate family context', {
          keyword: substrateContent.keyword,
          recordCount: substrateContent.recordCount,
          originalContextLength,
          newContextLength: session.fullContext.length,
          addedLength: session.fullContext.length - originalContextLength
        });

        // Let the LLM generate a welcome message based on the loaded data
        setMessages([]);
        setSessionActive(true);

        // Send an initial prompt to the LLM to generate a welcome message
        const initialPrompt = `Substrate family "${substrateContent.keyword}" with ${substrateContent.recordCount} material records has been loaded for user ${userName}. Please greet ${userName} by name and explain what you can help with regarding this stock management data for substrate family "${substrateContent.keyword}".`;

        // Trigger the LLM to generate welcome message (hidden from UI)
        // Pass the session directly to ensure substrate context is included
        setTimeout(() => {
          handleSendMessage(initialPrompt, true, session);  // Pass session with substrate context
        }, 100);
      }
    } catch (error) {
      console.error('Failed to initialize chat with substrate context:', error);
      toast.error('Failed to initialize chat with substrate family data');
    } finally {
      setSessionInitializing(false);
    }
  };

  // Initialize continuous improvement session when user starts chatting
  const initializeContinuousImprovement = async () => {
    if (!user || continuousImprovementSessionId) return;

    try {
      // For now, use a default prompt key if we don't have the actual one
      // This should be updated when the user selects/creates a prompt version
      const promptKey = currentPromptKey || `${user.email?.split('@')[0] || 'user'}_v1`;
      const sessionId = await createContinuousImprovementSession(promptKey, chatSessionKey, user.uid);
      setContinuousImprovementSessionId(sessionId);
      console.log('📊 Continuous improvement session initialized:', sessionId);


      // Get system LLM model for logging
      const systemModel = user ? await getUserLLMModel(user.uid) : 'google/gemini-2.5-flash';

      // Log session start info
      console.log('🎯 Console logging enabled for session', {
        sessionId,
        userId: user.uid,
        userEmail: user.email,
        promptKey,
        chatSessionKey,
        model: systemModel
      });
    } catch (error) {
      console.error('Failed to initialize continuous improvement session:', error);

      // Log critical error
      console.error('Failed to initialize continuous improvement', {
        error: error instanceof Error ? error.message : String(error),
        userId: user?.uid,
        chatSessionKey
      });
    }
  };

  // Handle user feedback for specific message - opens dialog
  const handleFeedback = async (feedback: 'thumbs_up' | 'thumbs_down', messageIndex: number) => {
    console.log(`${feedback === 'thumbs_up' ? '👍' : '👎'} User clicked ${feedback} for message ${messageIndex}`);

    if (!continuousImprovementSessionId) {
      await initializeContinuousImprovement();
    }

    // Store pending feedback and open dialog
    setPendingFeedback(feedback);
    setPendingMessageIndex(messageIndex);
    setFeedbackComment('');
    setFeedbackDialogOpen(true);
  };

  // Submit feedback with optional comment
  const submitFeedback = async () => {
    if (!continuousImprovementSessionId || !pendingFeedback || pendingMessageIndex === null) {
      console.warn('⚠️ Missing required data for feedback submission');
      return;
    }

    // Log feedback submission details
    console.log('════════════════════════════════════════════════');
    console.log('📨 SUBMITTING USER FEEDBACK');
    console.log('════════════════════════════════════════════════');
    console.log(`Message Index: ${pendingMessageIndex}`);
    console.log(`Feedback Type: ${pendingFeedback} ${pendingFeedback === 'thumbs_up' ? '👍' : '👎'}`);
    console.log(`Session ID: ${continuousImprovementSessionId}`);
    console.log(`Chat Session Key: ${chatSessionKey}`);

    // Get context about the feedback
    const evaluatedMessage = messages[pendingMessageIndex];
    const previousUserMessage = pendingMessageIndex > 0 ?
      messages.slice(0, pendingMessageIndex).reverse().find(m => m.role === 'user') : null;

    // Log the actual message being evaluated
    if (evaluatedMessage) {
      console.log(`Evaluated Message Role: ${evaluatedMessage.role}`);
      console.log(`Message Preview: ${evaluatedMessage.parts[0]?.text?.substring(0, 100)}...`);
    }

    if (feedbackComment) {
      console.log(`User Comment: "${feedbackComment}"`);
    }
    console.log('════════════════════════════════════════════════');

    try {
      // Create comprehensive feedback data
      const feedbackContext = {
        originalUserQuery: previousUserMessage?.parts[0]?.text || 'N/A',
        aiResponsePreview: evaluatedMessage?.parts[0]?.text?.substring(0, 500) || 'N/A',
        responseLength: evaluatedMessage?.parts[0]?.text?.length || 0,
        wasResponseComplete: evaluatedMessage?.parts[0]?.text ?
          !evaluatedMessage.parts[0].text.includes('...') &&
          evaluatedMessage.parts[0].text.length > 10 : false,
        responseEndsAbruptly: evaluatedMessage?.parts[0]?.text ?
          evaluatedMessage.parts[0].text.endsWith('...') ||
          evaluatedMessage.parts[0].text.endsWith(',') ||
          evaluatedMessage.parts[0].text.endsWith('-') : false
      };

      // Log detailed feedback event (avoiding duplicates)
      await addTechnicalLog(continuousImprovementSessionId, {
        event: 'user_feedback_submitted',
        feedbackType: pendingFeedback,
        messageIndex: pendingMessageIndex,
        userComment: feedbackComment || undefined,
        context: feedbackContext,
        timestamp: new Date().toISOString()
      });

      // Store the feedback itself (single call)
      await setUserFeedback(continuousImprovementSessionId, pendingFeedback, feedbackComment || undefined);


      console.log('✅ Feedback and logs submitted successfully');

      setFeedbackDialogOpen(false);
      setPendingFeedback(null);
      setPendingMessageIndex(null);
      setFeedbackComment('');

      toast.success(pendingFeedback === 'thumbs_up' ? '👍 Thanks for the positive feedback!' : '👎 Thanks for the feedback - we\'ll improve!');
    } catch (error) {
      console.error('❌ Failed to save feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  // Cancel feedback dialog
  const cancelFeedback = () => {
    setFeedbackDialogOpen(false);
    setPendingFeedback(null);
    setPendingMessageIndex(null);
    setFeedbackComment('');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center relative">
        {/* User info top left */}
        {user && (
          <div className="absolute top-4 left-4 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Logged in as: <span className="text-white font-medium">{user.email}</span>
            </span>
          </div>
        )}
        
        {/* Action buttons top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            onClick={handleOpenAdmin}
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
          {onLogout && (
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
        <div className="flex items-center justify-center mb-4">
          <img src="/logo.png" alt="Gravic" className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold">Marketing Agent</h1>
        </div>
        <p className="text-gray-100 text-lg mx-auto">
          Run, monitor and verify marketing campaigns - create mass tailored proposals with intelligent automation
        </p>
      </div>
      

      {/* Main Content under header with optional left panel */}
      {/* Controls row under header */}
      <div className="mx-auto px-4 mt-4 flex justify-between w-full">
        {topRightControls}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="chat-toggle" className="text-xs text-gray-500">Show chat</Label>
            <Switch
              id="chat-toggle"
              checked={chatVisible}
              onCheckedChange={onChatVisibleChange}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto px-2 pb-6 w-full">
        {leftPanelVisible && chatVisible ? (
          // Both panels visible - use resizable layout
          <ResizablePanelGroup direction="horizontal" className="h-full min-h-[60vh]">
            <ResizablePanel defaultSize={35} minSize={20} maxSize={60} className="pr-2">
              {leftPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={40} className="pl-2">
              {chatVisible && (
              <div className={"flex flex-col items-stretch"}>


            {/* Substrate Family Selector Section */}
            {!substrateData && (
              <div className="mb-4">
                <SubstrateFamilySelector
                  onFamilySelected={handleSubstrateFamilySelected}
                  disabled={isLoading || sessionInitializing}
                />
              </div>
            )}

            {/* Show loaded substrate family info */}
            {substrateData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-800">Substrate Family: {selectedKeyword}</p>
                      <p className="text-sm text-gray-600">
                        {substrateData.recordCount} material records loaded
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="p-2 space-y-6">
              <div className="max-w-full ml-0 mr-auto space-y-6">
                
          {sessionInitializing && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-gray-700" />
                </div>
                <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                  <span className="text-sm text-gray-600">Initializing AI with your knowledge base...</span>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-3 max-w-full w-full">
                {message.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-gray-700" />
                  </div>
                )}
                <div className="flex flex-col space-y-2 flex-1">
                  <div
                    className={`px-6 py-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto max-w-lg'
                        : 'bg-white shadow-sm border'
                    }`}
                  >
                    {message.parts.map((part, partIndex) => {
                      // Try to detect JSON tables (both supplier comparison and MRP decision tables)
                      let jsonTable = null;
                      let mrpTable = null;
                      let textWithoutJson = part.text || '';

                      if (part.text && message.role === 'model') {
                        // Look for JSON code block
                        const jsonMatch = part.text.match(/```json\s*([\s\S]*?)\s*```/);
                        if (jsonMatch) {
                          try {
                            const jsonData = JSON.parse(jsonMatch[1]);

                            // Check if it's a supplier comparison table
                            if (jsonData.type === 'supplier_comparison_table') {
                              jsonTable = jsonData;
                              textWithoutJson = part.text.replace(/```json[\s\S]*?```/, '').trim();
                            }
                            // Check if it's an MRP decision table (array format)
                            else if (Array.isArray(jsonData) && jsonData.length > 0) {
                              mrpTable = jsonData;
                              textWithoutJson = part.text.replace(/```json[\s\S]*?```/, '').trim();
                            }
                          } catch (e) {
                            console.log('Failed to parse JSON table:', e);
                          }
                        }
                      }

                      return (
                        <div key={partIndex}>
                          {textWithoutJson && (
                            <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none markdown-content`}>
                              <ReactMarkdown>
                                {(() => {
                                  const { originalText, formattedSources } = processTextWithCitations(
                                    textWithoutJson,
                                    message.citationMetadata?.citationSources
                                  );
                                  return originalText + (formattedSources.length > 0 ? '\n\n**Sources:**\n' + formattedSources.join('\n') : '');
                                })()}
                              </ReactMarkdown>
                            </div>
                          )}
                          {jsonTable && (
                            <div className="mt-4">
                              <InteractiveJsonTable
                                data={jsonTable}
                                compact={true}
                                enableExport={false}
                                enableSearch={false}
                                enableSort={true}
                              />
                            </div>
                          )}
                          {mrpTable && (
                            <div className="mt-4">
                              <MrpDecisionTable
                                data={mrpTable}
                                substrateFamilyKeyword={substrateData?.keyword}
                                compact={true}
                                enableSort={true}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Function usage indicators */}
                    {message.functionsUsed && (
                      <FunctionUsageIndicator functionsUsed={message.functionsUsed} />
                    )}
                  </div>

                  {/* Feedback buttons for AI responses only */}
                  {message.role === 'model' && (
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-500">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_up', index)}
                        className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-auto"
                        title="Good response"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('thumbs_down', index)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
                        title="Poor response"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-gray-700" />
                </div>
                <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border rounded-md p-6">
              <div className="max-w-full mx-auto">
                <div className="flex space-x-4 items-end">
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder={substrateData ? "Ask about the stock management data..." : "Please select a substrate family first"}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading || !substrateData}
                      className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading || !substrateData}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="h-12 px-6 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Chat
                  </Button>
                </div>
              </div>
            </div>
              </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : leftPanelVisible && !chatVisible ? (
          // Only left panel visible
          <div className="h-full min-h-[60vh]">
            {leftPanel}
          </div>
        ) : chatVisible ? (
          <div>
            {/* When no left panel, show full-width chat */}
            <div className={"flex flex-col items-stretch"}>

              {/* Substrate Family Selector Section */}
              {!substrateData && (
                <div className="mb-4">
                  <SubstrateFamilySelector
                    onFamilySelected={handleSubstrateFamilySelected}
                    disabled={isLoading || sessionInitializing}
                  />
                </div>
              )}

              {/* Show loaded substrate family info */}
              {substrateData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-800">Substrate Family: {selectedKeyword}</p>
                        <p className="text-sm text-gray-600">
                          {substrateData.recordCount} material records loaded
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2 space-y-6">
                <div className="max-w-full mx-auto space-y-6">
                  {sessionInitializing && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                          <span className="text-sm text-gray-600">Initializing AI with your knowledge base...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start space-x-3 max-w-full w-full">
                        {message.role === 'model' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-gray-700" />
                          </div>
                        )}
                        <div className="flex flex-col space-y-2 flex-1">
                          <div className={`px-6 py-4 rounded-2xl ${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto max-w-lg' : 'bg-white shadow-sm border'}`}>
                            {message.parts.map((part, partIndex) => {
                              // Try to detect JSON tables (both supplier comparison and MRP decision tables)
                              let jsonTable = null;
                              let mrpTable = null;
                              let textWithoutJson = part.text || '';

                              if (part.text && message.role === 'model') {
                                // Look for JSON code block
                                const jsonMatch = part.text.match(/```json\s*([\s\S]*?)\s*```/);
                                if (jsonMatch) {
                                  try {
                                    const jsonData = JSON.parse(jsonMatch[1]);

                                    // Check if it's a supplier comparison table
                                    if (jsonData.type === 'supplier_comparison_table') {
                                      jsonTable = jsonData;
                                      textWithoutJson = part.text.replace(/```json[\s\S]*?```/, '').trim();
                                    }
                                    // Check if it's an MRP decision table (array format)
                                    else if (Array.isArray(jsonData) && jsonData.length > 0) {
                                      mrpTable = jsonData;
                                      textWithoutJson = part.text.replace(/```json[\s\S]*?```/, '').trim();
                                    }
                                  } catch (e) {
                                    console.log('Failed to parse JSON table:', e);
                                  }
                                }
                              }

                              return (
                                <div key={partIndex}>
                                  {textWithoutJson && (
                                    <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none markdown-content`}>
                                      <ReactMarkdown>
                                        {(() => {
                                          const { originalText, formattedSources } = processTextWithCitations(textWithoutJson, message.citationMetadata?.citationSources);
                                          return originalText + (formattedSources.length > 0 ? '\n\n**Sources:**\n' + formattedSources.join('\n') : '');
                                        })()}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                  {jsonTable && (
                                    <div className="mt-4">
                                      <InteractiveJsonTable
                                        data={jsonTable}
                                        compact={true}
                                        enableExport={false}
                                        enableSearch={false}
                                        enableSort={true}
                                      />
                                    </div>
                                  )}
                                  {mrpTable && (
                                    <div className="mt-4">
                                      <MrpDecisionTable
                                        data={mrpTable}
                                        substrateFamilyKeyword={substrateData?.keyword}
                                        compact={true}
                                        enableSort={true}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Function usage indicators */}
                            {message.functionsUsed && (
                              <FunctionUsageIndicator functionsUsed={message.functionsUsed} />
                            )}
                          </div>
                          {message.role === 'model' && (
                            <div className="flex items-center space-x-2 ml-2">
                              <span className="text-xs text-gray-500">Was this helpful?</span>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_up', index)} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1 h-auto" title="Good response">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleFeedback('thumbs_down', index)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 h-auto" title="Poor response">
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Bot className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="bg-white shadow-sm border rounded-2xl px-6 py-4 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border rounded-md p-6">
                <div className="max-w-full mx-auto">
                  <div className="flex space-x-4 items-end">
                    <div className="flex-1">
                      <Input ref={inputRef} type="text" placeholder={substrateData ? "Ask about the stock management data..." : "Please select a substrate family first"} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading || !substrateData} className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
                    </div>
                    <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading || !substrateData} className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                      <Send className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                      className="h-12 px-6 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Neither panel visible - show message
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Please enable either the chat or verification panel using the toggles above.</p>
          </div>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingFeedback === 'thumbs_up' ? (
                <ThumbsUp className="h-5 w-5 text-green-600" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-red-600" />
              )}
              {pendingFeedback === 'thumbs_up' ? 'Positive feedback' : 'Feedback for improvement'}
            </DialogTitle>
            <DialogDescription>
              {pendingFeedback === 'thumbs_up' 
                ? 'Great! What did you like about this response?' 
                : 'Help us improve! What could be better about this response?'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="feedback-comment">Comment (optional)</Label>
              <Textarea
                id="feedback-comment"
                placeholder={pendingFeedback === 'thumbs_up' 
                  ? 'What worked well? Any specific aspects you found helpful?'
                  : 'What was missing or incorrect? How could we improve?'
                }
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelFeedback}
            >
              Skip
            </Button>
            <Button
              onClick={submitFeedback}
              className={pendingFeedback === 'thumbs_up' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MarketingPlannerChat;
import React, { useState, useRef } from 'react';
// Using OpenRouter API instead of Google Generative AI
type Part = { text: string };
import { Loader2, Send, RotateCcw, Paperclip, Bot, LogOut, Settings, ThumbsUp, ThumbsDown } from "lucide-react";
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
import { getSystemPromptForUser } from '../lib/systemPromptService';
import { erpApiService } from '../lib/erpApiService';
import { storageService } from '../lib/storageService';
import { createPurchaseRequisition } from '@/lib/firestoreService';
import { useQueryClient } from '@tanstack/react-query';
import { search_ext_labour_suppliers, MAIN_CATEGORY_LOV } from '../lib/supplierSearchFunction';
import { purchaseRequisitionService, RequisitionStatus } from '../lib/purchaseRequisitionService';
import { InteractiveJsonTable } from './InteractiveJsonTable';
import { search_training_suppliers } from '../lib/chatFunctions';

interface ProfessionalBuyerChatProps {
  onLogout?: () => void;
  leftPanel?: React.ReactNode;
  leftPanelVisible?: boolean;
  chatVisible?: boolean;
  onChatVisibleChange?: (visible: boolean) => void;
  topRightControls?: React.ReactNode;
}

const openRouterApiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY || '';
// Using Grok-4-fast model via OpenRouter (free tier)
const geminiModel = 'x-ai/grok-4-fast:free';

// External Labour Suppliers Search Function (Collection: ext_labour_suppliers)
const searchExtLabourSuppliersFunction = {
  name: "search_ext_labour_suppliers",
  description: "Search for verified suppliers in Valmet's supplier database. IMPORTANT: mainCategory must be EXACTLY one of the valid LOV values. For 'vuokratyövoima' or 'henkilöstövuokraus', use 'Leased workforce'. For 'IT-konsultointi', use 'IT consulting'. Always use the exact English LOV values.",
  parameters: {
    type: "object",
    properties: {
      mainCategory: {
        type: "string",
        enum: MAIN_CATEGORY_LOV.map(c => c.value),
        description: `Main category to search. MUST be one of these exact values: ${MAIN_CATEGORY_LOV.map(c => c.value).join(', ')}`
      },
      supplierCategories: {
        type: "string",
        description: "Free text search in supplier categories"
      },
      country: {
        type: "string",
        description: "Country to filter by (e.g., Finland, Sweden, Germany)"
      },
      city: {
        type: "string",
        description: "City to filter by"
      },
      vendorName: {
        type: "string",
        description: "Vendor/company name to search for (fuzzy search in Company, Branch, Corporation fields)"
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)"
      }
    }
  }
};

// Training Invoices Search Function (Collection: invoices_training_2023)
const searchInvoicesTraining2023Function = {
  name: "search_invoices_training_2023",
  description: "Search training invoices from 2023 by supplier, amount, status. Returns formatted invoice records.",
  parameters: {
    type: "object",
    properties: {
      businessPartner: {
        type: "string",
        description: "Supplier/vendor name (partial match supported)"
      },
      status: {
        type: "string",
        enum: ["Completed", "Pending", "In Review", "Rejected", "Paid"],
        description: "Invoice status"
      },
      minAmount: {
        type: "number",
        description: "Minimum invoice amount in EUR"
      },
      maxAmount: {
        type: "number",
        description: "Maximum invoice amount in EUR"
      },
      approver: {
        type: "string",
        description: "Name of the approver"
      },
      reviewer: {
        type: "string",
        description: "Name of the reviewer"
      },
      limit: {
        type: "number",
        description: "Maximum results to return (default: 10)"
      }
    }
  }
};

// Contracts Search Function (Collection: ipro_contracts)
const searchIproContractsFunction = {
  name: "search_ipro_contracts",
  description: "Search iPRO contracts by supplier, status, active/expired. Returns contract records with details.",
  parameters: {
    type: "object",
    properties: {
      supplier: {
        type: "string",
        description: "Supplier name (fuzzy search)"
      },
      searchText: {
        type: "string",
        description: "General text search across all contract fields"
      },
      activeOnly: {
        type: "boolean",
        description: "Filter for active contracts only"
      },
      status: {
        type: "string",
        enum: ["Active", "Expired", "Draft", "Terminated", "Renewed"],
        description: "Contract state"
      },
      limit: {
        type: "number",
        description: "Maximum results to return (default: 10)"
      }
    }
  }
};

// Training Suppliers Search Function (Collection: training_suppliers)
// LIMITED TO: deliveryCountry, natureOfService, trainingArea only
const searchTrainingSuppliersFunction = {
  name: "search_training_suppliers",
  description: "Search training suppliers database. NOTE: Search is limited to delivery country, nature of service, and training area only.",
  parameters: {
    type: "object",
    properties: {
      deliveryCountry: {
        type: "string",
        description: "Country where training can be delivered (e.g., Finland, Sweden, Global)"
      },
      natureOfService: {
        type: "string",
        description: "Type/nature of the training service (e.g., Leadership, HSE, Coaching)"
      },
      trainingArea: {
        type: "string",
        description: "Specific training area or topic (e.g., Safety training, EMBA, Coaching)"
      },
      limit: {
        type: "number",
        description: "Maximum results to return (default: 10)"
      }
    }
  }
};

// Purchase Requisition Function (Basware-style as per system prompt)
const createRequisitionFunction = {
  name: "create_purchase_requisition",
  description: "Create a purchase requisition in Basware via POST API. This creates a formal request that needs approval before becoming a purchase order.",
  parameters: {
    type: "object",
    properties: {
      header: {
        type: "object",
        description: "Object containing requisition header information",
        properties: {
          requisitionId: {
            type: "string",
            description: "External identifier for the requisition (optional)"
          },
          requisitionType: {
            type: "string",
            description: "Type of requisition (e.g., standard, service)"
          },
          status: {
            type: "string",
            description: "Initial status (e.g., Draft, Submitted)"
          },
          requester: {
            type: "string",
            description: "Identifier of the person creating the requisition"
          },
          companyCode: {
            type: "string",
            description: "Company or business unit code"
          },
          costCenter: {
            type: "string",
            description: "Cost center or accounting assignment"
          },
          supplierId: {
            type: "string",
            description: "Supplier identifier (optional)"
          },
          contractId: {
            type: "string",
            description: "Reference to framework agreement or contract (optional)"
          },
          justification: {
            type: "string",
            description: "Notes or justification for the request (optional)"
          }
        },
        required: ["requisitionType", "status", "requester", "companyCode"]
      },
      lines: {
        type: "array",
        description: "Array of requisition line items",
        items: {
          type: "object",
          properties: {
            lineId: {
              type: "string",
              description: "Line item identifier"
            },
            description: {
              type: "string",
              description: "Item or service description"
            },
            quantity: {
              type: "number",
              description: "Quantity requested"
            },
            unitOfMeasure: {
              type: "string",
              description: "Unit of measure (e.g., PCS, H)"
            },
            unitPrice: {
              type: "number",
              description: "Unit price (optional)"
            },
            currency: {
              type: "string",
              description: "Currency code (default: EUR)"
            },
            glAccount: {
              type: "string",
              description: "General ledger account or other coding"
            },
            deliveryDate: {
              type: "string",
              description: "Requested delivery date (YYYY-MM-DD)"
            },
            deliveryAddress: {
              type: "string",
              description: "Delivery address"
            },
            vendorNoOrName: {
              type: "string",
              description: "Suggested supplier (optional)"
            }
          },
          required: ["lineId", "description", "quantity", "unitOfMeasure", "deliveryDate", "deliveryAddress"]
        }
      },
      attachments: {
        type: "array",
        description: "Array of related files (e.g., technical specifications) - optional",
        items: {
          type: "string"
        }
      },
      customFields: {
        type: "object",
        description: "Customer-specific extension fields (optional)"
      }
    },
    required: ["header", "lines"]
  }
};

// Version and configuration logging
console.log('🔧 ProfessionalBuyerChat v3.6-fixed-prompt-source - using versioned prompts:', {
  version: '2.1-debug-functions',
  changes: 'Added extensive debugging to track function knowledge source',
  date: '2025-09-29',
  author: 'Claude',
  debug: 'Check console for TOOLS DEBUG, SYSTEM PROMPT DEBUG, and OPENROUTER API CALL DEBUG'
});

// Debug: Log OpenRouter API config
console.log('OpenRouter API config:', {
  apiKey: openRouterApiKey ? `${openRouterApiKey.substring(0, 10)}...` : 'undefined',
  model: geminiModel,  // x-ai/grok-4-fast:free
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
}

const processTextWithCitations = (text: string, citationSources?: CitationSource[]) => {
  const originalText = text;
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

const ProfessionalBuyerChat: React.FC<ProfessionalBuyerChatProps> = ({ onLogout, leftPanel, leftPanelVisible = false, chatVisible = true, onChatVisibleChange, topRightControls }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      setStatusLoading(true);
      try {
        const [prompt, knowledge, erp] = await Promise.all([
          sessionService.getLatestSystemPrompt(user.uid),
          storageService.getUserDocuments(user.uid).catch(() => []),
          storageService.getUserERPDocuments(user.uid).catch(() => [])
        ]);
        setInitStatus({
          hasPrompt: !!prompt?.systemPrompt,
          knowledgeCount: Array.isArray(knowledge) ? knowledge.length : 0,
          erpCount: Array.isArray(erp) ? erp.length : 0
        });
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, [user]);

  // Initialize chat session with context
  React.useEffect(() => {
    console.log('🔄 COMPONENT MOUNTED/REMOUNTED - Initializing fresh session');
    console.log('Current messages count:', messages.length);
    console.log('Session active:', sessionActive);

    const initializeSession = async () => {
      if (!sessionActive && user && !sessionInitializing) {
        setSessionInitializing(true)
        console.log('🆕 Starting fresh session initialization...');
        try {
          // Initialize session with system prompt + knowledge documents
          const session = await sessionService.initializeChatSession(user.uid);
          setChatSession(session);
          console.log('🆕 Chat session initialized:', {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            documentsUsed: session.documentsUsed.length,
            documentsNames: session.documentsUsed.map(d => d.fileName || d.name || 'unknown'),
            promptLength: session.systemPrompt.length,
            knowledgeContextLength: session.knowledgeContext?.length,
            contextLength: session.fullContext.length
          });

          // LOG ALL INITIALIZATION DATA
          console.log('🔴🔴🔴 COMPLETE SESSION INITIALIZATION DATA:');
          console.log('1. SYSTEM PROMPT:', session.systemPrompt);
          console.log('2. KNOWLEDGE CONTEXT:', session.knowledgeContext);
          console.log('3. FULL CONTEXT:', session.fullContext);
          console.log('4. DOCUMENTS USED:', session.documentsUsed);
          console.log('🔴🔴🔴 END OF INITIALIZATION DATA');
          
          // Check if this is a new user (no documents loaded)
          const isLikelyNewUser = session.documentsUsed.length === 0;
          
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: `How can I help you with external labour purchasing today?`
            }]
          };
          setMessages([welcomeMessage]);
          setSessionActive(true);
          
          if (isLikelyNewUser) {
            toast.success("🎉 Welcome! Your AI assistant is ready. Visit the Admin panel to load sample data and explore capabilities.", {
              duration: 6000
            });
          } else {
            toast.success(`Session initialized with ${session.documentsUsed.length} knowledge document(s)`);
          }
        } catch (error) {
          console.error('Failed to initialize session:', error);
          toast.error('Failed to load knowledge base. Using default settings.');
          
          // Fallback to basic welcome message
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: "Hei! 👋 Olen Valmet-hankinta-avustajasi.\n\nAutan sinua löytämään parhaat toimittajat ulkopuoliselle työvoimalle Suomessa. Minulla on pääsy 410 vahvistettuun toimittajaan (IT-palvelut eivät kuulu laajuuteen).\n\n**Miten voin auttaa tänään?**\nVoit esimerkiksi sanoa:\n• \"Etsi liikkeenjohdon konsultteja\"\n• \"Näytä koulutuspalvelut\"\n• \"Tarvitsen vuokratyövoimaa\"\n• \"Etsi insinööripalveluita\"\n\nKerro vain tarpeesi, niin etsitään sinulle sopivat toimittajat! 🎯"
            }]
          };
          setMessages([welcomeMessage]);
          setSessionActive(true);
        } finally {
          setSessionInitializing(false);
        }
      }
    };

    initializeSession();
  }, [sessionActive, user, sessionInitializing]);


  const handleSendMessage = async (messageText?: string) => {
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
      // DEBUG: Log what's being sent to OpenRouter
      console.log('🚀 OPENROUTER API CALL DEBUG:', {
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
            'X-Title': 'Valmet Procurement Assistant'
          },
          body: JSON.stringify((() => {
            const requestBody = {
              model: geminiModel,
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

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);

    // Reset the response flag for new message
    hasReceivedResponseRef.current = false;

    // Auto-reset loading state after 45 seconds as failsafe
    let loadingTimeoutId = setTimeout(() => {
      // Only show error if we're still loading and haven't received a response
      setIsLoading(currentLoading => {
        if (currentLoading && !hasReceivedResponseRef.current) {
          console.error('Message processing timeout - resetting loading state');

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

          // Only show error message if we haven't received any response
          setMessages(prev => [...prev, {
            role: 'model',
            parts: [{ text: '⚠️ Response timeout. The request took too long to process. Please try again with a simpler query.' }]
          }]);
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
      
      if (chatSession) {
        // Use the full context from initialized session (system prompt + knowledge documents)
        console.log('📦 USING CHAT SESSION FULL CONTEXT', {
          sessionId: chatSession.sessionId,
          createdAt: chatSession.createdAt,
          age: new Date().getTime() - new Date(chatSession.createdAt).getTime(),
          ageInMinutes: Math.floor((new Date().getTime() - new Date(chatSession.createdAt).getTime()) / 60000),
          systemPromptLength: chatSession.systemPrompt?.length,
          knowledgeContextLength: chatSession.knowledgeContext?.length,
          fullContextLength: chatSession.fullContext?.length,
          documentsUsed: chatSession.documentsUsed?.length
        });

        // LOG THE COMPLETE FULL CONTEXT
        console.log('🔍 FULL CONTEXT BEING SENT (COMPLETE):', chatSession.fullContext);

        systemPrompt = chatSession.fullContext;
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

      // Prepare tools for OpenRouter - only 3 functions as per system prompt
      const openRouterTools = [
        {
          type: 'function',
          function: {
            name: 'search_ext_labour_suppliers',
            description: searchExtLabourSuppliersFunction.description,
            parameters: searchExtLabourSuppliersFunction.parameters
          }
        },
        {
          type: 'function',
          function: {
            name: 'search_training_suppliers',
            description: searchTrainingSuppliersFunction.description,
            parameters: searchTrainingSuppliersFunction.parameters
          }
        },
        {
          type: 'function',
          function: {
            name: 'create_purchase_requisition',
            description: createRequisitionFunction.description,
            parameters: createRequisitionFunction.parameters
          }
        }
      ];

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
              if (functionName === 'search_ext_labour_suppliers') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  
                  // Log AI function call details
                  console.log('🤖 AI SUPPLIER SEARCH CALL [' + aiRequestId + ']:', {
                    triggered_by_user_message: textToSend,
                    function_name: functionName,
                    ai_generated_parameters: functionArgs,
                    timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Log function call triggered
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_triggered',
                      userMessage: textToSend,
                      functionName: functionName,
                      functionInputs: functionArgs,
                      aiRequestId: aiRequestId
                    });
                  }

                  // Execute supplier search
                  const searchResult = await search_ext_labour_suppliers(functionArgs);
                  
                  // Log consolidated AI + Supplier search results
                  console.log('🔗 AI-SUPPLIER SEARCH RESULT [' + aiRequestId + ']:', {
                    user_query: textToSend,
                    ai_function_call: functionName,
                    ai_parameters: functionArgs,
                    supplier_result_summary: {
                      totalRecords: searchResult.totalFound,
                      success: searchResult.success,
                      hasData: searchResult.totalFound > 0
                    },
                    execution_timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Log function call success
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_success',
                      functionName: functionName,
                      functionInputs: functionArgs,
                      functionOutputs: {
                        totalRecords: searchResult.totalFound,
                        success: searchResult.success,
                        hasData: searchResult.totalFound > 0,
                        suppliersPreview: searchResult.suppliers.slice(0, 3) // First 3 suppliers as preview
                      },
                      aiRequestId: aiRequestId
                    });
                  }
                  
                  // Create function response
                  const functionResponse = {
                    role: 'model' as const,
                    parts: [{
                      functionResponse: {
                        name: functionName,
                        response: {
                          success: searchResult.success,
                          totalFound: searchResult.totalFound,
                          suppliers: searchResult.suppliers,
                          error: searchResult.error
                        }
                      }
                    }]
                  };
                  
                  // Generate follow-up response with function results using OpenRouter
                  const messagesWithFunctionResult = [
                    ...messages,
                    { role: 'user', parts: [{ text: textToSend }] },
                    { role: 'model', parts: [{ text: `Calling function: ${functionName}` }] },
                    { role: 'user', parts: [{ text: `Function result: ${JSON.stringify(searchResult)}` }] }
                  ];

                  const followUpResult = await callOpenRouterAPI(messagesWithFunctionResult, systemPrompt);

                  if (followUpResult?.choices?.[0]?.message) {
                    const aiResponseText = followUpResult.choices[0].message.content || "No response text";
                    
                    // Log AI's final response
                    console.log('💬 AI FINAL RESPONSE [' + aiRequestId + ']:', {
                      response_text_length: aiResponseText.length,
                      response_preview: aiResponseText.substring(0, 200) + (aiResponseText.length > 200 ? '...' : ''),
                      included_erp_data: searchResult.totalCount > 0,
                      timestamp: new Date().toISOString(),
                      ai_request_id: aiRequestId
                    });

                    // Log AI response
                    if (continuousImprovementSessionId) {
                      await addTechnicalLog(continuousImprovementSessionId, {
                        event: 'ai_response',
                        aiResponse: aiResponseText.substring(0, 500), // First 500 chars to avoid too much data
                        aiRequestId: aiRequestId
                      });
                    }
                    
                    hasReceivedResponseRef.current = true; // Mark that we've received a response
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: [{ text: aiResponseText }]
                    }]);
                  }
                  return;
                } catch (functionError) {
                  // Log AI function call error
                  console.log('❌ AI FUNCTION CALL ERROR [' + aiRequestId + ']:', {
                    user_query: textToSend,
                    function_name: functionName,
                    ai_parameters: functionArgs,
                    error: functionError instanceof Error ? functionError.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                    ai_request_id: aiRequestId
                  });

                  // Log function call error
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_error',
                      functionName: functionName,
                      functionInputs: functionArgs,
                      errorMessage: functionError instanceof Error ? functionError.message : 'Unknown error',
                      aiRequestId: aiRequestId
                    });
                  }
                  
                  console.error('Function execution failed:', functionError);
                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `I tried to search for suppliers but encountered an error: ${functionError instanceof Error ? functionError.message : 'Unknown error'}. Please try again with different search criteria.` }]
                  }]);
                  return;
                }
              }
              if (functionName === 'create_purchase_requisition') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  const args = functionArgs as any;

                  if (!user) throw new Error('Not authenticated');

                  // Extract header and lines from Basware-style structure
                  const header = args.header || {};
                  const lines = args.lines || [];

                  // Prepare line items with proper structure for our Firestore
                  const lineItems = lines.map((item: any, index: number) => ({
                    lineNumber: parseInt(item.lineId) || (index + 1),
                    itemDescription: item.description,
                    quantity: item.quantity,
                    unitOfMeasure: item.unitOfMeasure,
                    unitPrice: item.unitPrice || 0,
                    totalAmount: item.quantity * (item.unitPrice || 0),
                    supplierName: item.vendorNoOrName || header.supplierId || '',
                    categoryCode: item.glAccount || '',
                    requestedDate: item.deliveryDate
                  }));

                  // Create requisition using our service with Basware header data
                  const requisitionData = {
                    externalCode: header.requisitionId || `AI-${Date.now()}`,
                    requesterId: user.uid, // Always use the authenticated user's ID
                    requesterName: header.requester || user.email || 'Unknown',
                    requesterEmail: user.email || '',
                    department: header.companyCode || 'General',
                    requestedDeliveryDate: lines[0]?.deliveryDate || new Date().toISOString().split('T')[0],
                    status: header.status === 'Submitted' ? RequisitionStatus.SUBMITTED : RequisitionStatus.DRAFT,
                    currency: lines[0]?.currency || 'EUR',
                    preferredSupplier: header.supplierId || '',
                    deliveryAddress: {
                      locationCode: header.costCenter || 'FI-HEL-01',
                      locationName: lines[0]?.deliveryAddress || 'Valmet Helsinki Office',
                      city: 'Helsinki',
                      country: 'Finland'
                    },
                    lineItems: lineItems,
                    businessJustification: header.justification || '',
                    urgencyLevel: 'medium',
                    contractId: header.contractId,
                    attachments: args.attachments,
                    customFields: args.customFields
                  };

                  const requisitionId = await purchaseRequisitionService.createRequisition(
                    user.uid,
                    requisitionData,
                    user.email || undefined
                  );

                  // Log success
                  console.log('✅ Purchase requisition created via AI (Basware format):', requisitionId);

                  // Calculate total
                  const total = lineItems.reduce((sum: number, item: any) => sum + item.totalAmount, 0);

                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{
                      text: `✅ Purchase requisition created successfully!\n\n` +
                            `**Requisition ID:** ${requisitionId}\n` +
                            `**External Reference:** ${requisitionData.externalCode}\n` +
                            `**Company Code:** ${header.companyCode || 'General'}\n` +
                            `**Cost Center:** ${header.costCenter || 'Default'}\n` +
                            `**Total Amount:** €${total.toFixed(2)}\n` +
                            `**Status:** ${header.status || 'Draft'}\n` +
                            `**Items:** ${lineItems.length} line item(s)\n\n` +
                            `The requisition has been created. You can view, edit, and submit it for approval in the Purchase Requisition Verification panel.`
                    }]
                  }]);

                  return;
                } catch (err) {
                  console.error('Failed to create requisition:', err);
                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{
                      text: `❌ Failed to create purchase requisition: ${err instanceof Error ? err.message : 'Unknown error'}`
                    }]
                  }]);
                  return;
                }
              } else if (functionName === 'search_invoices_training_2023') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  console.log('🧾 AI INVOICE SEARCH CALL [' + aiRequestId + ']:', functionArgs);

                  // Log function call
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_triggered',
                      userMessage: textToSend,
                      functionName: functionName,
                      functionInputs: functionArgs,
                      aiRequestId: aiRequestId
                    });
                  }

                  const searchResult = await search_invoices_training_2023(functionArgs);

                  // Generate follow-up response with function results
                  const messagesWithFunctionResult = [
                    ...messages,
                    { role: 'user', parts: [{ text: textToSend }] },
                    { role: 'model', parts: [{ text: `Searching training invoices...` }] },
                    { role: 'user', parts: [{ text: `Function result: ${JSON.stringify(searchResult)}` }] }
                  ];

                  const followUpResult = await callOpenRouterAPI(messagesWithFunctionResult, systemPrompt);

                  if (followUpResult?.choices?.[0]?.message) {
                    const aiResponseText = followUpResult.choices[0].message.content || "No response text";
                    hasReceivedResponseRef.current = true; // Mark that we've received a response
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: [{ text: aiResponseText }]
                    }]);
                  }
                  return;
                } catch (err) {
                  console.error('Failed to search invoices:', err);

                  // Log function error
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_error',
                      functionName: functionName,
                      functionInputs: functionArgs,
                      error: err instanceof Error ? err.message : String(err),
                      aiRequestId: aiRequestId
                    });
                  }

                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `❌ Failed to search invoices: ${err instanceof Error ? err.message : 'Unknown error'}` }]
                  }]);
                  return;
                }
              } else if (functionName === 'search_ipro_contracts') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  console.log('📄 AI CONTRACT SEARCH CALL [' + aiRequestId + ']:', functionArgs);

                  // Log function call
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_triggered',
                      userMessage: textToSend,
                      functionName: functionName,
                      functionInputs: functionArgs,
                      aiRequestId: aiRequestId
                    });
                  }

                  const searchResult = await search_ipro_contracts(functionArgs);

                  // Generate follow-up response with function results
                  const messagesWithFunctionResult = [
                    ...messages,
                    { role: 'user', parts: [{ text: textToSend }] },
                    { role: 'model', parts: [{ text: `Searching contracts...` }] },
                    { role: 'user', parts: [{ text: `Function result: ${JSON.stringify(searchResult)}` }] }
                  ];

                  const followUpResult = await callOpenRouterAPI(messagesWithFunctionResult, systemPrompt);

                  if (followUpResult?.choices?.[0]?.message) {
                    const aiResponseText = followUpResult.choices[0].message.content || "No response text";
                    hasReceivedResponseRef.current = true; // Mark that we've received a response
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: [{ text: aiResponseText }]
                    }]);
                  }
                  return;
                } catch (err) {
                  console.error('Failed to search contracts:', err);

                  // Log function error
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_error',
                      functionName: functionName,
                      functionInputs: functionArgs,
                      error: err instanceof Error ? err.message : String(err),
                      aiRequestId: aiRequestId
                    });
                  }

                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `❌ Failed to search contracts: ${err instanceof Error ? err.message : 'Unknown error'}` }]
                  }]);
                  return;
                }
              } else if (functionName === 'search_training_suppliers') {
                try {
                  const aiRequestId = Math.random().toString(36).substring(2, 8);
                  console.log('🎓 AI TRAINING SUPPLIER SEARCH CALL [' + aiRequestId + ']:', functionArgs);

                  // Log function call
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_triggered',
                      userMessage: textToSend,
                      functionName: functionName,
                      functionInputs: functionArgs,
                      aiRequestId: aiRequestId
                    });
                  }

                  const searchResult = await search_training_suppliers(functionArgs);

                  // Generate follow-up response with function results
                  const messagesWithFunctionResult = [
                    ...messages,
                    { role: 'user', parts: [{ text: textToSend }] },
                    { role: 'model', parts: [{ text: `Searching training suppliers...` }] },
                    { role: 'user', parts: [{ text: `Function result: ${JSON.stringify(searchResult)}` }] }
                  ];

                  const followUpResult = await callOpenRouterAPI(messagesWithFunctionResult, systemPrompt);

                  if (followUpResult?.choices?.[0]?.message) {
                    const aiResponseText = followUpResult.choices[0].message.content || "No response text";
                    hasReceivedResponseRef.current = true; // Mark that we've received a response
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: [{ text: aiResponseText }]
                    }]);
                  }
                  return;
                } catch (err) {
                  console.error('Failed to search training suppliers:', err);

                  // Log function error
                  if (continuousImprovementSessionId) {
                    await addTechnicalLog(continuousImprovementSessionId, {
                      event: 'function_call_error',
                      functionName: functionName,
                      functionInputs: functionArgs,
                      error: err instanceof Error ? err.message : String(err),
                      aiRequestId: aiRequestId
                    });
                  }

                  setMessages(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: `❌ Failed to search training suppliers: ${err instanceof Error ? err.message : 'Unknown error'}` }]
                  }]);
                  return;
                }
              }
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
          setMessages(prev => [...prev, {
            role: 'model',
            parts: [{ text: aiResponseText }],
            citationMetadata: undefined  // OpenRouter doesn't provide citations
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
        model: geminiModel,
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


      // Log session start info
      console.log('🎯 Console logging enabled for session', {
        sessionId,
        userId: user.uid,
        userEmail: user.email,
        promptKey,
        chatSessionKey,
        model: geminiModel
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
    <div className="flex flex-col h-screen bg-valmet-lightgray">
      {/* Header */}
      <div className="bg-gradient-to-r from-valmet-green to-valmet-teal text-white p-8 text-center relative">
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
          <Bot className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Valmet Purchaser AI Assistant</h1>
        </div>
        <p className="text-gray-100 text-lg max-w-7xl mx-auto">
          Get expert procurement advice, use prenegotiated prices from best suppliers, and do professional level procurement with ease
        </p>
      </div>
      

      {/* Main Content under header with optional left panel */}
      {/* Controls row under header */}
      <div className="max-w-7xl mx-auto px-4 mt-4 flex justify-between w-full">
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
          <Button
            variant="outline"
            onClick={handleResetChat}
            className="text-red-600 border-red-200 hover:bg-red-50"
            size="sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Chat
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 pb-6 w-full">
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


            {/* Quick Action Pills removed for simplified interface */}

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
                        ? 'bg-valmet-green text-white ml-auto max-w-lg'
                        : 'bg-white shadow-sm border'
                    }`}
                  >
                    {message.parts.map((part, partIndex) => {
                      // Try to detect JSON supplier comparison table
                      let jsonTable = null;
                      let textWithoutJson = part.text || '';

                      if (part.text && message.role === 'model') {
                        // Look for JSON code block
                        const jsonMatch = part.text.match(/```json\s*([\s\S]*?)\s*```/);
                        if (jsonMatch) {
                          try {
                            const jsonData = JSON.parse(jsonMatch[1]);
                            if (jsonData.type === 'supplier_comparison_table') {
                              jsonTable = jsonData;
                              // Remove JSON from text
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
                            <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none`}>
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
                        </div>
                      );
                    })}
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
                      placeholder="Ask about procurement strategies, cost optimization, supplier management..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-valmet-green focus:border-transparent"
                    />
                  </div>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="h-12 px-6 bg-valmet-green hover:bg-valmet-darkgreen text-white rounded-xl"
                  >
                    <Send className="h-5 w-5" />
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

              {/* Quick Action Pills removed for simplified interface */}
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
                          <div className={`px-6 py-4 rounded-2xl ${message.role === 'user' ? 'bg-valmet-green text-white ml-auto max-w-lg' : 'bg-white shadow-sm border'}`}>
                            {message.parts.map((part, partIndex) => {
                              // Try to detect JSON supplier comparison table
                              let jsonTable = null;
                              let textWithoutJson = part.text || '';

                              if (part.text && message.role === 'model') {
                                // Look for JSON code block
                                const jsonMatch = part.text.match(/```json\s*([\s\S]*?)\s*```/);
                                if (jsonMatch) {
                                  try {
                                    const jsonData = JSON.parse(jsonMatch[1]);
                                    if (jsonData.type === 'supplier_comparison_table') {
                                      jsonTable = jsonData;
                                      // Remove JSON from text
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
                                    <div className={`prose ${message.role === 'user' ? 'prose-invert' : ''} prose-sm max-w-none`}>
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
                                </div>
                              );
                            })}
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
                      <Input ref={inputRef} type="text" placeholder="Ask about procurement strategies, cost optimization, supplier management..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading || !initStatus.hasPrompt} className="w-full h-12 px-4 text-lg border-gray-300 rounded-xl focus:ring-2 focus:ring-valmet-green focus:border-transparent" />
                    </div>
                    <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading || !initStatus.hasPrompt} className="h-12 px-6 bg-valmet-green hover:bg-valmet-darkgreen text-white rounded-xl">
                      <Send className="h-5 w-5" />
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
};

export default ProfessionalBuyerChat;
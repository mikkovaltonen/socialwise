import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Loader2, Send, RotateCcw, Paperclip, Bot, LogOut, Settings, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loadLatestPrompt, createContinuousImprovementSession, addTechnicalLog, setUserFeedback } from '../lib/firestoreService';
import { sessionService, ChatSession } from '../lib/sessionService';
import { erpApiService } from '../lib/erpApiService';
import { storageService } from '../lib/storageService';
import { createPurchaseRequisition } from '@/lib/firestoreService';
import { useQueryClient } from '@tanstack/react-query';
import { searchSuppliersForChat, MAIN_CATEGORY_LOV } from '../lib/supplierSearchFunction';
import { purchaseRequisitionService, RequisitionStatus } from '../lib/purchaseRequisitionService';
import { InteractiveJsonTable } from './InteractiveJsonTable';
import { consoleLogger } from '../lib/consoleLogger';

interface ProfessionalBuyerChatProps {
  onLogout?: () => void;
  leftPanel?: React.ReactNode;
  leftPanelVisible?: boolean;
  topRightControls?: React.ReactNode;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
// Use gemini-2.5-flash model
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

// Supplier Search Function Definition for Gemini
const searchSuppliersFunction = {
  name: "search_suppliers",
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
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)"
      }
    }
  }
};

// ERP search function removed - only supplier search is used

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

// Debug: Log Gemini API config
console.log('Gemini API config:', {
  apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
  model: geminiModel
});

const genAI = new GoogleGenerativeAI(apiKey);

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

const ProfessionalBuyerChat: React.FC<ProfessionalBuyerChatProps> = ({ onLogout, leftPanel, leftPanelVisible = false, topRightControls }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [sessionInitializing, setSessionInitializing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
    const initializeSession = async () => {
      if (!sessionActive && user && !sessionInitializing) {
        setSessionInitializing(true);
        try {
          // Initialize session with system prompt + knowledge documents
          const session = await sessionService.initializeChatSession(user.uid);
          setChatSession(session);
          
          // Check if this is a new user (no documents loaded)
          const isLikelyNewUser = session.documentsUsed.length === 0;
          
          const welcomeMessage: Message = {
            role: 'model',
            parts: [{
              text: isLikelyNewUser 
                ? `🎯 **Valmet Finland External Workforce Assistant**

I help you find and select the best suppliers for external workforce needs in Finland.

**Available services:** IT consulting • Business consulting • Training • Legal services • R&D services • Leased workforce

**Quick actions:**
• "Find IT consulting suppliers in Finland"
• "Show me training providers"
• "List legal service vendors"

520+ verified suppliers ready to search. What service do you need?`
                : `Hello! I'm your Valmet External Workforce Assistant for Finland. I help you find suppliers for consulting, training, legal, and other professional services.

📚 **Knowledge Base Loaded:** ${session.documentsUsed.length} document(s) available for reference.

What can I help you with today?`
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
              text: "Hei! 👋 Olen Valmet-hankinta-avustajasi.\n\nAutan sinua löytämään parhaat toimittajat ulkopuoliselle työvoimalle Suomessa. Minulla on pääsy 520+ vahvistettuun toimittajaan.\n\n**Miten voin auttaa tänään?**\nVoit esimerkiksi sanoa:\n• \"Etsi IT-konsultteja Helsingistä\"\n• \"Näytä koulutuspalvelut\"\n• \"Tarvitsen vuokratyövoimaa\"\n\nKerro vain tarpeesi, niin etsitään sinulle sopivat toimittajat! 🎯"
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

    // System prompt check removed - default prompt is always available

    // Initialize continuous improvement if not already done
    if (!continuousImprovementSessionId) {
      await initializeContinuousImprovement();
    }

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);
    
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
        systemPrompt = chatSession.fullContext;
      } else {
        // Fallback: try to load latest prompt for this user
        if (user?.uid) {
          try {
            const latestPrompt = await loadLatestPrompt(user.uid);
            if (latestPrompt) {
              systemPrompt = latestPrompt;
            }
          } catch (error) {
            console.error('Error loading latest prompt:', error);
          }
        }

        // No fallback - if no prompt available, show error
        if (!systemPrompt) {
          throw new Error('No system prompt configured. Please visit Admin panel to set up your prompt.');
        }
      }

      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { temperature: 0.2 },
        tools: [
          { functionDeclarations: [searchSuppliersFunction, createRequisitionFunction] }
        ]
      });

      const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history, 
          { role: 'user', parts: [{ text: textToSend }] }
        ]
      });

      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const content = candidate.content;
        
        // Check for function calls
        if (content?.parts) {
          for (const part of content.parts) {
            if (part.functionCall) {
              const functionName = part.functionCall.name;
              const functionArgs = part.functionCall.args;
              
              if (functionName === 'search_suppliers') {
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
                  const searchResult = await searchSuppliersForChat(functionArgs);
                  
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
                  
                  // Generate follow-up response with function results
                  const followUpResult = await model.generateContent({
                    contents: [
                      { role: 'user', parts: [{ text: systemPrompt }] },
                      ...history,
                      { role: 'user', parts: [{ text: textToSend }] },
                      { role: 'model', parts: [part] }, // Original function call
                      functionResponse // Function response
                    ]
                  });
                  
                  const followUpResponse = followUpResult.response;
                  if (followUpResponse?.candidates?.[0]?.content) {
                    const aiResponseText = followUpResponse.candidates[0].content?.parts?.[0]?.text || "No response text";
                    
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
                    
                    setMessages(prev => [...prev, {
                      role: 'model',
                      parts: followUpResponse.candidates[0].content?.parts || [{ text: "I executed the search but couldn't format the response." }]
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
                    requesterId: header.requester || user.uid,
                    requesterName: user.email || 'Unknown',
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
                    requisitionData
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
              }
            }
          }
        }
        
        let processedCitationMetadata: { citationSources: CitationSource[] } | undefined = undefined;
        if (candidate.citationMetadata && candidate.citationMetadata.citationSources) {
          processedCitationMetadata = candidate.citationMetadata;
        }

        // Log regular AI response (non-function call)
        const aiResponseText = content?.parts?.[0]?.text || "No response text";
        if (continuousImprovementSessionId) {
          await addTechnicalLog(continuousImprovementSessionId, {
            event: 'ai_response',
            aiResponse: aiResponseText.substring(0, 500) // First 500 chars to avoid too much data
          });
        }

        setMessages(prev => [...prev, {
          role: 'model',
          parts: content?.parts || [{ text: "I couldn't generate a response." }],
          citationMetadata: processedCitationMetadata
        }]);
      } else {
        throw new Error('No response from AI model');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Log critical error to Firebase
      await consoleLogger.sendCriticalLog('Chat message send failed', {
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

      // Enable console logging in collecting mode (don't auto-send)
      consoleLogger.enableCollecting();
      consoleLogger.setUserId(user.uid);

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

      // Send critical error to Firebase
      await consoleLogger.sendCriticalLog('Failed to initialize continuous improvement', {
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

    // Log the actual message being evaluated
    if (messages[pendingMessageIndex]) {
      const evaluatedMessage = messages[pendingMessageIndex];
      console.log(`Evaluated Message Role: ${evaluatedMessage.role}`);
      console.log(`Message Preview: ${evaluatedMessage.parts[0]?.text?.substring(0, 100)}...`);
    }

    if (feedbackComment) {
      console.log(`User Comment: "${feedbackComment}"`);
    }
    console.log('════════════════════════════════════════════════');

    try {
      // Add message context to the feedback log
      await addTechnicalLog(continuousImprovementSessionId, {
        event: 'ai_response',
        aiResponse: `User feedback for message ${pendingMessageIndex}: ${pendingFeedback}${feedbackComment ? ` - Comment: ${feedbackComment}` : ''}`,
        userFeedback: pendingFeedback,
        userComment: feedbackComment || undefined,
      });

      await setUserFeedback(continuousImprovementSessionId, pendingFeedback, feedbackComment || undefined);

      // Send console logs with feedback
      await consoleLogger.sendLogsWithFeedback(pendingFeedback, feedbackComment || undefined);

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

      <div className="max-w-7xl mx-auto px-2 pb-6 w-full">
        {leftPanelVisible ? (
          <ResizablePanelGroup direction="horizontal" className="h-full min-h-[60vh]">
            <ResizablePanel defaultSize={35} minSize={20} maxSize={60} className="pr-2">
              {leftPanel}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65} minSize={40} className="pl-2">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
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
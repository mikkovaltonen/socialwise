import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// Legacy SystemPromptVersion interface removed - now using simplified crm_system_prompts collection
// See systemPromptService.ts for new implementation

export interface ContinuousImprovementSession {
  id?: string;
  promptKey: string; // References SystemPromptVersion.technicalKey
  chatSessionKey: string; // Unique identifier for this chat session
  userId: string;
  userFeedback?: 'thumbs_up' | 'thumbs_down' | null;
  userComment?: string; // Optional comment from user
  issueStatus?: 'fixed' | 'not_fixed'; // Status for negative feedback issues
  solution?: string; // Solution description when issue is marked as fixed
  solutionDate?: Date; // When the solution was provided
  technicalLogs: TechnicalLog[];
  createdDate: Date;
  lastUpdated: Date;
}

export interface TechnicalLog {
  timestamp: Date;
  event: 'function_call_triggered' | 'function_call_success' | 'function_call_error' | 'ai_response' | 'user_message';
  userMessage?: string;
  functionName?: string;
  functionInputs?: Record<string, unknown>;
  functionOutputs?: Record<string, unknown>;
  aiResponse?: string;
  errorMessage?: string;
  aiRequestId?: string;
}

// ============================================================================
// Continuous Improvement Functions
// ============================================================================
// Legacy system prompt functions removed - now using systemPromptService.ts
// Only continuous improvement (feedback tracking) functions remain below
// ============================================================================
export const createContinuousImprovementSession = async (
  promptKey: string,
  chatSessionKey: string,
  userId: string
): Promise<string> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot create continuous improvement session');
      return 'local_session_' + Date.now();
    }

    const session: Omit<ContinuousImprovementSession, 'id'> = {
      promptKey,
      chatSessionKey,
      userId,
      userFeedback: null,
      technicalLogs: [],
      createdDate: new Date(),
      lastUpdated: new Date()
    };

    const docRef = await addDoc(collection(db, 'jatkuva_parantaminen'), {
      ...session,
      createdDate: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });

    console.log(`[ContinuousImprovement] Created session with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating continuous improvement session:', error);
    return 'error_session_' + Date.now();
  }
};

export const addTechnicalLog = async (
  sessionId: string,
  logEntry: Omit<TechnicalLog, 'timestamp'>
): Promise<void> => {
  try {
    if (!db || sessionId.startsWith('local_') || sessionId.startsWith('error_')) {
      console.warn('Firebase not initialized or invalid session, skipping log');
      return;
    }

    const sessionRef = doc(db, 'jatkuva_parantaminen', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data() as ContinuousImprovementSession;
      const updatedLogs = [
        ...sessionData.technicalLogs,
        {
          ...logEntry,
          timestamp: new Date()
        }
      ];

      await setDoc(sessionRef, {
        technicalLogs: updatedLogs,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      console.log(`[ContinuousImprovement] Added log to session ${sessionId}: ${logEntry.event}`);
    }
  } catch (error) {
    console.error('Error adding technical log:', error);
  }
};

export const setUserFeedback = async (
  sessionId: string,
  feedback: 'thumbs_up' | 'thumbs_down',
  comment?: string
): Promise<void> => {
  // Detailed logging for feedback
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 USER FEEDBACK RECEIVED`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🆔 Session ID: ${sessionId}`);
  console.log(`${feedback === 'thumbs_up' ? '👍' : '👎'} Feedback: ${feedback}`);
  if (comment) {
    console.log(`💬 User Comment: "${comment}"`);
  }
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    if (!db || sessionId.startsWith('local_') || sessionId.startsWith('error_')) {
      console.warn('⚠️ Firebase not initialized or invalid session, skipping feedback save');
      return;
    }

    const sessionRef = doc(db, 'jatkuva_parantaminen', sessionId);
    const updateData: any = {
      userFeedback: feedback,
      lastUpdated: serverTimestamp()
    };

    if (comment !== undefined) {
      updateData.userComment = comment;
    }

    await setDoc(sessionRef, updateData, { merge: true });

    console.log(`✅ Feedback saved successfully to Firestore`);

    // If negative feedback, log additional debug info
    if (feedback === 'thumbs_down') {
      console.log('🔍 NEGATIVE FEEDBACK ALERT - Check session logs for debugging:');
      console.log(`   - Session: ${sessionId}`);
      console.log(`   - Issue: ${comment || 'No specific comment provided'}`);
      console.log('   - Action: Review technical logs in Firebase Console');
    }
  } catch (error) {
    console.error('❌ Error saving user feedback:', error);
  }
};

export const getContinuousImprovementSessions = async (
  userId: string,
  promptKey?: string
): Promise<ContinuousImprovementSession[]> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot get sessions');
      return [];
    }

    let q = query(
      collection(db, 'jatkuva_parantaminen'),
      where('userId', '==', userId)
    );

    if (promptKey) {
      q = query(q, where('promptKey', '==', promptKey));
    }

    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdDate: doc.data().createdDate?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as ContinuousImprovementSession[];

    return sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  } catch (error) {
    console.error('Error getting continuous improvement sessions:', error);
    return [];
  }
};

// Get negative feedback sessions (for issue reporting)
export const getNegativeFeedbackSessions = async (
  userId?: string // If not provided, get all users' feedback
): Promise<ContinuousImprovementSession[]> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot get negative feedback');
      return [];
    }

    let q = query(
      collection(db, 'jatkuva_parantaminen'),
      where('userFeedback', '==', 'thumbs_down')
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdDate: doc.data().createdDate?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as ContinuousImprovementSession[];

    return sessions.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  } catch (error) {
    console.error('Error getting negative feedback sessions:', error);
    return [];
  }
};

// Update issue status for negative feedback
export const updateIssueStatus = async (
  sessionId: string,
  status: 'fixed' | 'not_fixed',
  solution?: string
): Promise<void> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot update issue status');
      return;
    }

    const sessionRef = doc(db, 'jatkuva_parantaminen', sessionId);
    const updateData: Record<string, unknown> = {
      issueStatus: status,
      lastUpdated: serverTimestamp()
    };

    // If marking as fixed and solution provided, add it
    if (status === 'fixed' && solution) {
      updateData.solution = solution;
      updateData.solutionDate = serverTimestamp();
    }

    // If marking as not fixed, clear the solution
    if (status === 'not_fixed') {
      updateData.solution = null;
      updateData.solutionDate = null;
    }

    await setDoc(sessionRef, updateData, { merge: true });

    console.log(`[ContinuousImprovement] Updated issue status for session ${sessionId}: ${status}`);
  } catch (error) {
    console.error('Error updating issue status:', error);
  }
};



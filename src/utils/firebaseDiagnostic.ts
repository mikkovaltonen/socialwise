/**
 * Firebase Diagnostic Tool
 * Helps identify and fix Firebase connection issues
 */

import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class FirebaseDiagnostic {
  private results: DiagnosticResult[] = [];

  async runAllTests(): Promise<DiagnosticResult[]> {
    this.results = [];

    // Test 1: Check Firebase Configuration
    await this.testFirebaseConfig();

    // Test 2: Check Auth State
    await this.testAuthState();

    // Test 3: Test Firestore Connection
    await this.testFirestoreConnection();

    // Test 4: Test Firestore Read
    await this.testFirestoreRead();

    // Test 5: Check Network
    await this.testNetworkConnectivity();

    return this.results;
  }

  private async testFirebaseConfig(): Promise<void> {
    try {
      const config = {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '[SET]' : '[MISSING]',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? '[SET]' : '[MISSING]',
      };

      if (!config.projectId) {
        this.results.push({
          test: 'Firebase Configuration',
          status: 'error',
          message: 'Project ID is missing',
          details: config
        });
      } else if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        this.results.push({
          test: 'Firebase Configuration',
          status: 'error',
          message: 'API Key is missing',
          details: config
        });
      } else {
        this.results.push({
          test: 'Firebase Configuration',
          status: 'success',
          message: `Project: ${config.projectId}`,
          details: config
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Firebase Configuration',
        status: 'error',
        message: 'Failed to read configuration',
        details: error
      });
    }
  }

  private async testAuthState(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.results.push({
          test: 'Authentication State',
          status: 'warning',
          message: 'Auth state check timed out',
        });
        resolve();
      }, 3000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();

        if (user) {
          this.results.push({
            test: 'Authentication State',
            status: 'success',
            message: `User authenticated: ${user.email}`,
            details: {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified
            }
          });
        } else {
          this.results.push({
            test: 'Authentication State',
            status: 'warning',
            message: 'No user authenticated',
          });
        }
        resolve();
      }, (error) => {
        clearTimeout(timeout);
        unsubscribe();
        this.results.push({
          test: 'Authentication State',
          status: 'error',
          message: 'Auth state check failed',
          details: error
        });
        resolve();
      });
    });
  }

  private async testFirestoreConnection(): Promise<void> {
    try {
      if (!db) {
        this.results.push({
          test: 'Firestore Connection',
          status: 'error',
          message: 'Firestore not initialized',
        });
        return;
      }

      // Try to access Firestore settings
      this.results.push({
        test: 'Firestore Connection',
        status: 'success',
        message: 'Firestore instance created',
        details: {
          type: typeof db,
          hasToJSON: typeof (db as any).toJSON === 'function'
        }
      });
    } catch (error) {
      this.results.push({
        test: 'Firestore Connection',
        status: 'error',
        message: 'Failed to connect to Firestore',
        details: error
      });
    }
  }

  private async testFirestoreRead(): Promise<void> {
    try {
      // Set a timeout for Firestore operations
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore read timeout')), 5000);
      });

      // Try to read a simple document
      const testDoc = doc(db, 'botin_ohjeet/production');
      const docSnap = await Promise.race([
        getDoc(testDoc),
        timeoutPromise
      ]);

      if (docSnap) {
        this.results.push({
          test: 'Firestore Read',
          status: 'success',
          message: 'Successfully read from Firestore',
          details: {
            exists: docSnap.exists(),
            path: 'botin_ohjeet/production'
          }
        });
      }
    } catch (error: any) {
      if (error?.message?.includes('timeout')) {
        this.results.push({
          test: 'Firestore Read',
          status: 'error',
          message: 'Firestore read timed out (5s)',
          details: 'This usually indicates network or authentication issues'
        });
      } else if (error?.code === 'permission-denied') {
        this.results.push({
          test: 'Firestore Read',
          status: 'error',
          message: 'Permission denied - check Firestore rules',
          details: error
        });
      } else if (error?.code === 'unavailable') {
        this.results.push({
          test: 'Firestore Read',
          status: 'error',
          message: 'Firestore unavailable - check network connection',
          details: error
        });
      } else {
        this.results.push({
          test: 'Firestore Read',
          status: 'error',
          message: 'Failed to read from Firestore',
          details: {
            code: error?.code,
            message: error?.message,
            full: error
          }
        });
      }
    }
  }

  private async testNetworkConnectivity(): Promise<void> {
    try {
      // Test connectivity to Firebase services
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', {
        signal: controller.signal,
        method: 'HEAD'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.results.push({
          test: 'Network Connectivity',
          status: 'success',
          message: 'Can reach Google services',
        });
      } else {
        this.results.push({
          test: 'Network Connectivity',
          status: 'warning',
          message: `Google services returned ${response.status}`,
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.results.push({
          test: 'Network Connectivity',
          status: 'error',
          message: 'Network request timed out',
        });
      } else {
        this.results.push({
          test: 'Network Connectivity',
          status: 'error',
          message: 'Network connectivity issue',
          details: error
        });
      }
    }
  }

  printResults(): void {
    console.group('🔍 Firebase Diagnostic Results');

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'warning' ? '⚠️' : '❌';

      console.group(`${icon} ${result.test}`);
      console.log(`Status: ${result.status}`);
      console.log(`Message: ${result.message}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
      console.groupEnd();
    });

    console.groupEnd();
  }
}

// Export a singleton instance
export const firebaseDiagnostic = new FirebaseDiagnostic();

// Auto-run diagnostic in development
if (import.meta.env.DEV) {
  console.log('🔧 Running Firebase diagnostic...');
  firebaseDiagnostic.runAllTests().then(() => {
    firebaseDiagnostic.printResults();
  });
}
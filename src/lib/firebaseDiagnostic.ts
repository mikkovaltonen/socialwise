/**
 * Enhanced Firebase Diagnostic Tool
 * Helps identify and fix Firebase connection issues with detailed logging
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

    // Test 2: Verify API Key
    await this.testApiKey();

    // Test 3: Check Auth State
    await this.testAuthState();

    // Test 4: Test Firestore Connection
    await this.testFirestoreConnection();

    // Test 5: Test Firestore Read
    await this.testFirestoreRead();

    // Test 6: Check Network
    await this.testNetworkConnectivity();

    // Test 7: Verify Project ID
    await this.testProjectId();

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
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '[NOT SET - OK]'
      };

      // Check for critical missing fields
      const criticalFields = [];
      if (!config.projectId) criticalFields.push('PROJECT_ID');
      if (!import.meta.env.VITE_FIREBASE_API_KEY) criticalFields.push('API_KEY');
      if (!import.meta.env.VITE_FIREBASE_APP_ID) criticalFields.push('APP_ID');

      if (criticalFields.length > 0) {
        this.results.push({
          test: 'Firebase Configuration',
          status: 'error',
          message: `Critical fields missing: ${criticalFields.join(', ')}`,
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

  private async testApiKey(): Promise<void> {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      this.results.push({
        test: 'API Key Validation',
        status: 'error',
        message: 'API Key is missing'
      });
      return;
    }

    try {
      // Test the API key by making a request to Firebase Auth REST API
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'invalid' })
        }
      );

      const data = await response.json();

      if (response.status === 400 && data.error?.message === 'INVALID_ID_TOKEN') {
        // This is expected - the key works but token is invalid
        this.results.push({
          test: 'API Key Validation',
          status: 'success',
          message: 'API Key is valid',
          details: { keyLength: apiKey.length, firstChars: apiKey.substring(0, 10) }
        });
      } else if (response.status === 400 && data.error?.message === 'API_KEY_INVALID') {
        this.results.push({
          test: 'API Key Validation',
          status: 'error',
          message: 'API Key is invalid or doesn\'t match project',
          details: data.error
        });
      } else if (response.status === 403) {
        this.results.push({
          test: 'API Key Validation',
          status: 'error',
          message: 'API Key lacks permissions',
          details: data.error
        });
      } else {
        this.results.push({
          test: 'API Key Validation',
          status: 'warning',
          message: `Unexpected response: ${response.status}`,
          details: data
        });
      }
    } catch (error) {
      this.results.push({
        test: 'API Key Validation',
        status: 'error',
        message: 'Failed to validate API key',
        details: error
      });
    }
  }

  private async testProjectId(): Promise<void> {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
      this.results.push({
        test: 'Project ID Verification',
        status: 'error',
        message: 'Project ID or API Key missing'
      });
      return;
    }

    try {
      // Try to access Firestore REST API to verify project exists
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/test_connection`,
        {
          headers: {
            'x-goog-api-key': apiKey
          }
        }
      );

      if (response.status === 404) {
        // Document doesn't exist, but project is accessible
        this.results.push({
          test: 'Project ID Verification',
          status: 'success',
          message: `Project "${projectId}" is accessible`,
          details: { projectId, status: response.status }
        });
      } else if (response.status === 403) {
        this.results.push({
          test: 'Project ID Verification',
          status: 'error',
          message: `Project "${projectId}" exists but API key lacks permissions`,
          details: { projectId, status: response.status }
        });
      } else if (response.status === 401) {
        this.results.push({
          test: 'Project ID Verification',
          status: 'error',
          message: `Invalid API key for project "${projectId}"`,
          details: { projectId, status: response.status }
        });
      } else if (response.status === 400) {
        const text = await response.text();
        this.results.push({
          test: 'Project ID Verification',
          status: 'error',
          message: `Project "${projectId}" configuration error`,
          details: { projectId, status: response.status, error: text }
        });
      } else {
        this.results.push({
          test: 'Project ID Verification',
          status: 'warning',
          message: `Unexpected status: ${response.status}`,
          details: { projectId, status: response.status }
        });
      }
    } catch (error: any) {
      this.results.push({
        test: 'Project ID Verification',
        status: 'error',
        message: 'Failed to verify project ID',
        details: { projectId, error: error.message }
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

      // Log Firestore instance details
      const dbInfo = {
        type: typeof db,
        hasToJSON: typeof (db as any).toJSON === 'function',
        settings: (db as any)._settings || {}
      };

      this.results.push({
        test: 'Firestore Connection',
        status: 'success',
        message: 'Firestore instance created',
        details: dbInfo
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
      const testDoc = doc(db, 'system_prompts/production');
      console.log('🔍 Attempting to read document: system_prompts/production');

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
            path: 'system_prompts/production',
            id: docSnap.id
          }
        });
      }
    } catch (error: any) {
      console.error('🔴 Firestore read error details:', error);

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
      } else if (error?.code === 'failed-precondition') {
        this.results.push({
          test: 'Firestore Read',
          status: 'error',
          message: 'Firestore not properly initialized',
          details: { code: error.code, message: error.message }
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
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`);
    console.log(`Auth Domain: ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}`);

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

    // Summary
    const errors = this.results.filter(r => r.status === 'error');
    const warnings = this.results.filter(r => r.status === 'warning');
    const successes = this.results.filter(r => r.status === 'success');

    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${successes.length}/${this.results.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}/${this.results.length}`);
    console.log(`❌ Errors: ${errors.length}/${this.results.length}`);

    if (errors.length > 0) {
      console.log('\n🔴 Critical Issues:');
      errors.forEach(e => console.log(`  - ${e.test}: ${e.message}`));
    }

    console.groupEnd();
  }
}

// Export a singleton instance
export const firebaseDiagnostic = new FirebaseDiagnostic();

// Auto-run diagnostic in development
if (import.meta.env.DEV) {
  console.log('🔧 Running enhanced Firebase diagnostic...');
  firebaseDiagnostic.runAllTests().then(() => {
    firebaseDiagnostic.printResults();
  });
}
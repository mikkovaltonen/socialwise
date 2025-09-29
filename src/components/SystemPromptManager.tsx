/**
 * System Prompt Manager Component
 * Allows users to view, edit, and switch between production and testing prompt versions
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getSystemPrompt,
  saveSystemPrompt,
  getUserPromptPreference,
  setUserPromptPreference,
  copyPromptVersion,
  initializeSystemPrompts,
  resetPromptToDefault,
  PromptVersion,
  SystemPromptData
} from '@/lib/systemPromptService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Copy, RefreshCw, AlertCircle, Check, FileText, FlaskConical, User, RotateCcw } from 'lucide-react';

export default function SystemPromptManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productionPrompt, setProductionPrompt] = useState<SystemPromptData | null>(null);
  const [testingPrompt, setTestingPrompt] = useState<SystemPromptData | null>(null);
  const [productionContent, setProductionContent] = useState('');
  const [testingContent, setTestingContent] = useState('');
  const [userVersion, setUserVersion] = useState<PromptVersion>('production');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadPrompts();
      loadUserPreference();
    }
  }, [user]);

  const loadPrompts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Initialize prompts if needed
      await initializeSystemPrompts(user.uid);

      // Load both versions
      const [prod, test] = await Promise.all([
        getSystemPrompt('production'),
        getSystemPrompt('testing')
      ]);

      setProductionPrompt(prod);
      setTestingPrompt(test);
      setProductionContent(prod?.content || '');
      setTestingContent(test?.content || '');
    } catch (error) {
      console.error('Error loading prompts:', error);
      setError('Failed to load system prompts');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreference = async () => {
    if (!user) return;

    try {
      const preference = await getUserPromptPreference(user.uid);
      setUserVersion(preference);
    } catch (error) {
      console.error('Error loading user preference:', error);
    }
  };

  const handleSavePrompt = async (version: PromptVersion) => {
    if (!user) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const content = version === 'production' ? productionContent : testingContent;
      const success = await saveSystemPrompt(version, content, user.uid);

      if (success) {
        setMessage(`${version} prompt saved successfully`);
        // Reload prompts to get updated timestamps
        await loadPrompts();
      } else {
        setError(`Failed to save ${version} prompt`);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError(`Error saving ${version} prompt`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrompt = async (from: PromptVersion, to: PromptVersion) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const success = await copyPromptVersion(from, to, user.uid);

      if (success) {
        setMessage(`Copied ${from} to ${to} successfully`);
        // Reload prompts
        await loadPrompts();
      } else {
        setError(`Failed to copy ${from} to ${to}`);
      }
    } catch (error) {
      console.error('Error copying prompt:', error);
      setError(`Error copying prompt`);
    }
  };

  const handleResetToDefault = async (version: PromptVersion) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to reset the ${version} prompt to default? This will overwrite the current content.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const success = await resetPromptToDefault(version, user.uid);

      if (success) {
        setMessage(`${version} prompt reset to default successfully`);
        // Reload prompts to get updated content
        await loadPrompts();
      } else {
        setError(`Failed to reset ${version} prompt to default`);
      }
    } catch (error) {
      console.error('Error resetting prompt to default:', error);
      setError(`Error resetting ${version} prompt to default`);
    } finally {
      setSaving(false);
    }
  };

  const handleVersionChange = async (version: PromptVersion) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const success = await setUserPromptPreference(user.uid, version);

      if (success) {
        setUserVersion(version);
        setMessage(`Switched to ${version} version`);
      } else {
        setError('Failed to update preference');
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      setError('Error updating preference');
    }
  };

  const formatLastUpdated = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading prompts...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Active Prompt Version
          </CardTitle>
          <CardDescription>
            Select which version of the system prompt to use for your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label>Active Version:</Label>
            <Select value={userVersion} onValueChange={(v) => handleVersionChange(v as PromptVersion)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Production
                  </div>
                </SelectItem>
                <SelectItem value="testing">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Testing
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className={`px-3 py-1 rounded-full text-sm ${
              userVersion === 'production'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              Currently using: {userVersion}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Editor Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt Editor</CardTitle>
          <CardDescription>
            Manage production and testing versions of the system prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="production" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="production" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Production
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Testing
              </TabsTrigger>
            </TabsList>

            {/* Production Tab */}
            <TabsContent value="production" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Production Prompt (Stable)</Label>
                  <span className="text-sm text-gray-500">
                    Last updated: {formatLastUpdated(productionPrompt?.lastUpdated)}
                  </span>
                </div>
                <Textarea
                  value={productionContent}
                  onChange={(e) => setProductionContent(e.target.value)}
                  placeholder="Enter production system prompt..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSavePrompt('production')}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Production
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyPrompt('production', 'testing')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Testing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResetToDefault('production')}
                    disabled={saving}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Testing Prompt (Read-Only - Uses /public/system_prompt.md)</Label>
                  <span className="text-sm text-gray-500">
                    Always uses current system_prompt.md file
                  </span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Testing version is read-only and always uses the content from <code className="bg-yellow-100 px-1">/public/system_prompt.md</code>
                  </p>
                  <p className="text-sm text-yellow-800 mt-2">
                    To modify the testing prompt, edit the file directly in your code editor.
                  </p>
                </div>
                <Textarea
                  value={testingContent}
                  readOnly
                  disabled
                  placeholder="Content loaded from /public/system_prompt.md"
                  className="min-h-[400px] font-mono text-sm bg-gray-50 cursor-not-allowed"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Testing (Disabled)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyPrompt('testing', 'production')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Production
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {message && (
            <Alert className="mt-4">
              <Check className="w-4 h-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Prompt Versions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Production:</strong> The stable version stored in database. Can be edited and saved.
            Changes here affect all users who haven't selected a specific version.
          </p>
          <p>
            <strong>Testing:</strong> Read-only version that always uses <code className="bg-gray-100 px-1">/public/system_prompt.md</code>.
            Perfect for testing code changes. Edit the file directly in your code editor.
          </p>
          <p>
            <strong>Your Selection:</strong> Your personal preference is saved and will be used
            whenever you use the AI assistant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
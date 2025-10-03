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
  PromptVersion,
  SystemPromptData,
  getUserLLMModel,
  setUserLLMModel,
  LLMModel
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
import { Save, Copy, RefreshCw, AlertCircle, Check, FileText, FlaskConical, User, Bot, History, Maximize2 } from 'lucide-react';
import { PromptHistoryDialog } from './PromptHistoryDialog';
import { FullscreenPromptEditor } from './FullscreenPromptEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SystemPromptManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productionPrompt, setProductionPrompt] = useState<SystemPromptData | null>(null);
  const [testingPrompt, setTestingPrompt] = useState<SystemPromptData | null>(null);
  const [productionContent, setProductionContent] = useState('');
  const [testingContent, setTestingContent] = useState('');
  const [userVersion, setUserVersion] = useState<PromptVersion>('production');
  const [selectedModel, setSelectedModel] = useState<LLMModel>('x-ai/grok-4-fast:free');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showVersionCommentDialog, setShowVersionCommentDialog] = useState(false);
  const [versionComment, setVersionComment] = useState('');
  const [pendingSaveVersion, setPendingSaveVersion] = useState<PromptVersion | null>(null);
  const [showFullscreenEditor, setShowFullscreenEditor] = useState(false);
  const [fullscreenEditVersion, setFullscreenEditVersion] = useState<PromptVersion>('production');

  useEffect(() => {
    if (user) {
      loadPrompts();
      loadUserPreferences();
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

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const [promptPref, modelPref] = await Promise.all([
        getUserPromptPreference(user.uid),
        getUserLLMModel(user.uid)
      ]);
      setUserVersion(promptPref);
      setSelectedModel(modelPref);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleSavePrompt = async (version: PromptVersion) => {
    if (!user) return;

    // Show version comment dialog
    setPendingSaveVersion(version);
    setShowVersionCommentDialog(true);
  };

  const performSave = async () => {
    if (!user || !pendingSaveVersion) return;

    setSaving(true);
    setMessage('');
    setError('');
    setShowVersionCommentDialog(false);

    try {
      const content = pendingSaveVersion === 'production' ? productionContent : testingContent;
      const success = await saveSystemPrompt(
        pendingSaveVersion,
        content,
        user.uid,
        undefined,
        versionComment,
        user.email || ''
      );

      if (success) {
        setMessage(`${pendingSaveVersion} prompt saved successfully`);
        setVersionComment('');
        setPendingSaveVersion(null);
        // Reload prompts to get updated timestamps
        await loadPrompts();
      } else {
        setError(`Failed to save ${pendingSaveVersion} prompt`);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError(`Error saving ${pendingSaveVersion} prompt`);
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

  const handleModelChange = async (model: LLMModel) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const success = await setUserLLMModel(user.uid, model);

      if (success) {
        setSelectedModel(model);
        setMessage(`Your LLM model preference updated to ${model.includes('grok') ? 'Grok-4-Fast (Free)' : model === 'google/gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Gemini 2.5 Pro'}`);
      } else {
        setError('Failed to update model preference');
      }
    } catch (error) {
      console.error('Error updating system model:', error);
      setError('Error updating system model');
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
      {/* Configuration Card - Prompt Version & LLM Model */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Prompt Version */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Prompt Version</Label>
            </div>
            <div className="flex items-center gap-3">
              <Select value={userVersion} onValueChange={(v) => handleVersionChange(v as PromptVersion)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                </SelectContent>
              </Select>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                userVersion === 'production'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                Active
              </span>
            </div>
          </div>

          {/* Right: LLM Model */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Language Model</Label>
              <span className="text-xs text-gray-500">(OpenRouter BYOK)</span>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedModel} onValueChange={(v) => handleModelChange(v as LLMModel)}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {selectedModel.includes('grok')
                      ? 'Grok-4-Fast (Free)'
                      : selectedModel === 'google/gemini-2.5-flash'
                        ? 'Gemini 2.5 Flash'
                        : 'Gemini 2.5 Pro'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x-ai/grok-4-fast:free">Grok-4-Fast (Free)</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">Temp: 0</span>
            </div>
          </div>
        </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Last updated: {formatLastUpdated(productionPrompt?.lastUpdated)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFullscreenEditVersion('production');
                        setShowFullscreenEditor(true);
                      }}
                      title="Open fullscreen editor"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    {productionContent.split('\n').length} rows • {productionContent.length} characters
                  </div>
                  <Textarea
                    value={productionContent}
                    onChange={(e) => setProductionContent(e.target.value)}
                    placeholder="Enter production system prompt..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
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
                    onClick={() => setShowHistoryDialog(true)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyPrompt('production', 'testing')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Testing
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Testing Prompt (Read-Only - Uses /public/system_prompt.md)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Always uses current system_prompt.md file
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFullscreenEditVersion('testing');
                        setShowFullscreenEditor(true);
                      }}
                      title="View in fullscreen (read-only)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
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

      {/* History Dialog */}
      <PromptHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        version="production"
        onRevert={loadPrompts}
      />

      {/* Fullscreen Editor */}
      <FullscreenPromptEditor
        open={showFullscreenEditor}
        onOpenChange={setShowFullscreenEditor}
        content={fullscreenEditVersion === 'production' ? productionContent : testingContent}
        onChange={(content) => {
          if (fullscreenEditVersion === 'production') {
            setProductionContent(content);
          } else {
            setTestingContent(content);
          }
        }}
        onSave={() => handleSavePrompt(fullscreenEditVersion)}
        title={`${fullscreenEditVersion === 'production' ? 'Production' : 'Testing'} System Prompt`}
        saving={saving}
      />

      {/* Version Comment Dialog */}
      <Dialog open={showVersionCommentDialog} onOpenChange={setShowVersionCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Version Comment</DialogTitle>
            <DialogDescription>
              Describe the changes you made in this version. This helps track the history of modifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={versionComment}
              onChange={(e) => setVersionComment(e.target.value)}
              placeholder="e.g., Updated supplier categories, Added new compliance requirements, Fixed formatting issues..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVersionCommentDialog(false);
                setVersionComment('');
                setPendingSaveVersion(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={performSave}
              disabled={!versionComment.trim()}
            >
              Save with Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
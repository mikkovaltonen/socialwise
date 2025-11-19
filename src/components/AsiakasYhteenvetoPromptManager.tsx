/**
 * Asiakas Yhteenveto Prompt Manager Component
 * Manages client summary prompts with global LLM settings
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getLatestPrompt,
  savePrompt,
  getPromptHistory,
  initializePrompts,
  AsiakasYhteenvetoPrompt
} from '@/lib/asiakasYhteenvetoService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, RefreshCw, AlertCircle, Check, Bot, History, Maximize2 } from 'lucide-react';
import { FullscreenPromptEditor } from './FullscreenPromptEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AsiakasYhteenvetoPromptManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<AsiakasYhteenvetoPrompt | null>(null);
  const [content, setContent] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-flash-lite');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [promptVersion, setPromptVersionState] = useState<'test' | 'production'>('production');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [history, setHistory] = useState<AsiakasYhteenvetoPrompt[]>([]);
  const [showFullscreenEditor, setShowFullscreenEditor] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrompt();
    }
  }, [user]);

  const loadPrompt = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await initializePrompts(user.uid);
      const latest = await getLatestPrompt();
      setCurrentPrompt(latest);

      // Load all global settings from latest prompt
      if (latest) {
        setSelectedModel(latest.llmModel || 'google/gemini-2.5-flash-lite');
        setTemperature(latest.temperature ?? 0.3);
        setPromptVersionState(latest.promptVersion || 'production');

        // If test version, load from file instead of database
        if (latest.promptVersion === 'test') {
          try {
            const response = await fetch('/ASIAKAS_YHTEENVETO_PROMPT.md');
            if (response.ok) {
              const fileContent = await response.text();
              setContent(fileContent);
            } else {
              setContent(latest?.content || '');
            }
          } catch (err) {
            console.warn('Could not load test prompt file, using database version');
            setContent(latest?.content || '');
          }
        } else {
          // Production version - use database content
          setContent(latest?.content || '');
        }
      }
    } catch (error) {
      console.error('Error loading asiakas yhteenveto prompt:', error);
      setError('Failed to load asiakas yhteenveto prompt');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const promptHistory = await getPromptHistory(50);
      setHistory(promptHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSavePrompt = () => {
    setShowDescriptionDialog(true);
  };

  const performSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');
    setError('');
    setShowDescriptionDialog(false);

    try {
      const id = await savePrompt(
        content,
        user.uid,
        selectedModel,
        temperature,
        promptVersion,
        user.email || '',
        description || 'Asiakas yhteenveto prompt update'
      );

      if (id) {
        setMessage('Prompt saved successfully (including all global settings)');
        setDescription('');
        await loadPrompt();
      } else {
        setError('Failed to save prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError('Error saving prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (model: string) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const id = await savePrompt(
        content,
        user.uid,
        model,
        temperature,
        promptVersion,
        user.email || '',
        `LLM model changed to ${model}`
      );

      if (id) {
        setSelectedModel(model);
        setMessage(`Global LLM model updated to ${model} (affects all users)`);
        await loadPrompt();
      } else {
        setError('Failed to update model');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      setError('Error updating model');
    }
  };

  const handleTemperatureChange = async (temp: string) => {
    if (!user) return;

    setMessage('');
    setError('');

    const tempValue = parseFloat(temp);

    try {
      const id = await savePrompt(
        content,
        user.uid,
        selectedModel,
        tempValue,
        promptVersion,
        user.email || '',
        `Temperature changed to ${tempValue}`
      );

      if (id) {
        setTemperature(tempValue);
        setMessage(`Global temperature updated to ${tempValue} (affects all users)`);
        await loadPrompt();
      } else {
        setError('Failed to update temperature');
      }
    } catch (error) {
      console.error('Error updating temperature:', error);
      setError('Error updating temperature');
    }
  };

  const handlePromptVersionChange = async (version: 'test' | 'production') => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const id = await savePrompt(
        content,
        user.uid,
        selectedModel,
        temperature,
        version,
        user.email || '',
        `Prompt version changed to ${version === 'test' ? 'Test' : 'Production'}`
      );

      if (id) {
        setPromptVersionState(version);
        setMessage(`Global prompt version updated to ${version === 'test' ? 'Test (Tiedosto)' : 'Production (DB)'} (affects all users)`);
        await loadPrompt();
      } else {
        setError('Failed to update prompt version');
      }
    } catch (error) {
      console.error('Error updating prompt version:', error);
      setError('Error updating prompt version');
    }
  };

  const handleViewHistory = async () => {
    await loadHistory();
    setShowHistoryDialog(true);
  };

  const handleRevertToVersion = async (prompt: AsiakasYhteenvetoPrompt) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      await savePrompt(
        content,
        user.uid,
        selectedModel,
        temperature,
        promptVersion,
        user.email || '',
        'Auto-saved before revert'
      );

      setContent(prompt.content);
      setSelectedModel(prompt.llmModel || 'google/gemini-2.5-flash-lite');
      setTemperature(prompt.temperature ?? 0.3);
      setPromptVersionState(prompt.promptVersion || 'production');
      setMessage(`Reverted to version from ${formatDate(prompt.createdAt)}`);
      setShowHistoryDialog(false);
    } catch (error) {
      console.error('Error reverting:', error);
      setError('Error reverting to version');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading prompt...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card - LLM Model Selection */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-purple-600" />
          <Label className="text-sm font-medium">Globaalit AI-Asetukset</Label>
          <span className="text-xs text-gray-500">(OpenRouter)</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Nämä asetukset vaikuttavat kaikkiin käyttäjiin. Tallennetaan ASIAKAS_YHTEENVETO-collectioniin järjestelmäpromptin mukana.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Prompt Lähde</Label>
            <Select value={promptVersion} onValueChange={handlePromptVersionChange}>
              <SelectTrigger className="w-40">
                <SelectValue>
                  {promptVersion === 'test' ? 'Test (Tiedosto)' : 'Production (DB)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test (Tiedosto)</SelectItem>
                <SelectItem value="production">Production (DB)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
              <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="x-ai/grok-4-fast">Grok-4-Fast</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Temperature</Label>
            <Select value={temperature.toString()} onValueChange={handleTemperatureChange}>
              <SelectTrigger className="w-24">
                <SelectValue>{temperature}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="0.05">0.05</SelectItem>
                <SelectItem value="0.1">0.1</SelectItem>
                <SelectItem value="0.2">0.2</SelectItem>
                <SelectItem value="0.3">0.3</SelectItem>
                <SelectItem value="0.4">0.4</SelectItem>
                <SelectItem value="0.7">0.7</SelectItem>
                <SelectItem value="1">1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Prompt Editor */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Asiakas Yhteenveto Järjestelmäprompt</CardTitle>
              <CardDescription>
                Viimeisin versio • {currentPrompt ? formatDate(currentPrompt.createdAt) : 'Ei tallennettua promptia'}
                {currentPrompt?.createdByEmail && ` • ${currentPrompt.createdByEmail}`}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFullscreenEditor(true)}
              title="Open fullscreen editor"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {promptVersion === 'test' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Test-versio: Prompti luetaan tiedostosta <code className="px-1 py-0.5 bg-yellow-100 rounded text-xs">/public/ASIAKAS_YHTEENVETO_PROMPT.md</code> eikä sitä voi muokata täällä.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              {content.split('\n').length} riviä • {content.length} merkkiä
              {promptVersion === 'test' && <span className="ml-2 text-yellow-600 font-medium">• Read-only (tiedostosta)</span>}
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kirjoita järjestelmäprompt..."
              className="min-h-[500px] font-mono text-sm"
              id="asiakas-yhteenveto-prompt-editor"
              disabled={promptVersion === 'test'}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSavePrompt}
              disabled={saving || promptVersion === 'test'}
            >
              <Save className="w-4 h-4 mr-2" />
              Save New Version
            </Button>
            <Button
              variant="outline"
              onClick={handleViewHistory}
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>

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

      {/* Fullscreen Editor */}
      <FullscreenPromptEditor
        open={showFullscreenEditor}
        onOpenChange={setShowFullscreenEditor}
        content={content}
        onChange={setContent}
        onSave={handleSavePrompt}
        title="Asiakas Yhteenveto Prompt"
        saving={saving}
        disabled={promptVersion === 'test'}
        readOnlyMessage={promptVersion === 'test' ? 'Test-versio: Prompti luetaan tiedostosta /public/ASIAKAS_YHTEENVETO_PROMPT.md' : undefined}
      />

      {/* Description Dialog */}
      <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Version Description</DialogTitle>
            <DialogDescription>
              Describe the changes you made in this version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Updated summary format, Added new fields..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDescriptionDialog(false);
                setDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={performSave}
              disabled={!description.trim()}
            >
              Save with Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt History</DialogTitle>
            <DialogDescription>
              View and revert to previous versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No history available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Saved By</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>LLM Model</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((prompt, idx) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="text-xs">
                        {formatDate(prompt.createdAt)}
                        {idx === 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">
                            CURRENT
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{prompt.createdByEmail || prompt.createdBy}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 text-[10px] rounded ${
                          prompt.promptVersion === 'test'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {prompt.promptVersion === 'test' ? 'TEST' : 'PROD'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{prompt.llmModel || '-'}</TableCell>
                      <TableCell className="text-xs">{prompt.temperature ?? '-'}</TableCell>
                      <TableCell className="text-xs">{prompt.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        {idx !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevertToVersion(prompt)}
                          >
                            Revert
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Summary Prompt Manager Component
 * Manages the AI prompt for generating client summaries
 * Includes LLM model and temperature selection
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getLatestSummaryPrompt,
  saveSummaryPrompt,
  getSummaryPromptHistory,
  initializeSummaryPrompts,
  SummaryPrompt
} from '@/lib/summaryPromptService';
import { getUserPromptVersion, setUserPromptVersion } from '@/lib/systemPromptService';
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
import { Save, RefreshCw, AlertCircle, Check, Bot, History, Maximize2, Sparkles } from 'lucide-react';
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

export default function SummaryPromptManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<SummaryPrompt | null>(null);
  const [content, setContent] = useState('');
  const [promptVersion, setPromptVersionState] = useState<'test' | 'production'>('production');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [history, setHistory] = useState<SummaryPrompt[]>([]);
  const [showFullscreenEditor, setShowFullscreenEditor] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPrompt();
    }
  }, [user, promptVersion]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const versionPref = await getUserPromptVersion(user.uid);
      setPromptVersionState(versionPref);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadPrompt = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (promptVersion === 'test') {
        // Load from file
        const response = await fetch('/summary_prompt.md');
        if (response.ok) {
          const fileContent = await response.text();
          setContent(fileContent);
          setCurrentPrompt(null);
        } else {
          throw new Error('Could not load test summary prompt file');
        }
      } else {
        // Load from Firestore (production)
        await initializeSummaryPrompts(user.uid, user.email || '');
        const latest = await getLatestSummaryPrompt();
        setCurrentPrompt(latest);
        setContent(latest?.content || '');
      }
    } catch (error) {
      console.error('Error loading summary prompt:', error);
      setError('Failed to load summary prompt');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const promptHistory = await getSummaryPromptHistory();
      setHistory(promptHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSavePrompt = () => {
    // Show description dialog
    setShowDescriptionDialog(true);
  };

  const performSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');
    setError('');
    setShowDescriptionDialog(false);

    try {
      const id = await saveSummaryPrompt(
        content,
        description || 'Summary prompt update',
        user.uid,
        user.email || ''
      );

      if (id) {
        setMessage('Summary prompt saved successfully');
        setDescription('');
        // Reload prompt to get updated info
        await loadPrompt();
      } else {
        setError('Failed to save summary prompt');
      }
    } catch (error) {
      console.error('Error saving summary prompt:', error);
      setError('Error saving summary prompt');
    } finally {
      setSaving(false);
    }
  };

  const handlePromptVersionChange = async (version: 'test' | 'production') => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      const success = await setUserPromptVersion(user.uid, version);

      if (success) {
        setPromptVersionState(version);
        setMessage(`Summary prompt version changed to ${version === 'test' ? 'Test (file)' : 'Production (Firestore)'}`);
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

  const handleRevertToVersion = async (prompt: SummaryPrompt) => {
    if (!user) return;

    setMessage('');
    setError('');

    try {
      // Save current version to history before reverting
      await saveSummaryPrompt(
        content,
        'Auto-saved before revert',
        user.uid,
        user.email || ''
      );

      // Set content to historical version
      setContent(prompt.content);
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
    return new Intl.DateTimeFormat('fi-FI', {
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
          Ladataan promptia...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Huom:</strong> Tiivistelmän luominen käyttää samaa LLM-mallia, temperature-asetusta ja prompt-versiota kuin chatbot.
          Voit vaihtaa nämä "AI Promptin ja Mallin hallinta" -osiosta.
        </AlertDescription>
      </Alert>

      {/* Version Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">Prompt Versio</Label>
        </div>
        <Select value={promptVersion} onValueChange={handlePromptVersionChange}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {promptVersion === 'test' ? 'Test (File)' : 'Production (DB)'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test (File)</SelectItem>
            <SelectItem value="production">Production (DB)</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Prompt Editor */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Tiivistelmän Luonti - System Prompt
              </CardTitle>
              <CardDescription className="mt-2">
                Määrittele miten AI luo tiivistelmän asiakastiedoista
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewHistory}
              >
                <History className="w-4 h-4 mr-2" />
                Historia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreenEditor(true)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Koko näyttö
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {promptVersion === 'test' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Mode:</strong> Näytetään prompti tiedostosta <code>/public/summary_prompt.md</code>.
                Muokkaa tiedostoa suoraan tallentaaksesi muutokset. Tallennus tästä editorista tallentaa Production-versioon.
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="summary-prompt">Prompt Sisältö (Markdown)</Label>
            <div className="mt-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Kirjoita tiivistelmän luomisen ohjeistus..."
                className="min-h-[400px] font-mono text-sm"
                id="summary-prompt"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSavePrompt}
              disabled={saving || !content.trim()}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Tallennetaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Tallenna Prompt
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={loadPrompt}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Päivitä
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Description Dialog */}
      <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tallenna Uusi Versio</DialogTitle>
            <DialogDescription>
              Anna lyhyt kuvaus muutoksista (valinnainen)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Esim: Päivitetty tiivistelmän muotoilua"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDescriptionDialog(false)}>
              Peruuta
            </Button>
            <Button onClick={performSave} disabled={saving}>
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt Historia</DialogTitle>
            <DialogDescription>
              Kaikki aiemmat versiot
            </DialogDescription>
          </DialogHeader>
          <div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Ei historiaa</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Päivämäärä</TableHead>
                    <TableHead>Kuvaus</TableHead>
                    <TableHead>Tekijä</TableHead>
                    <TableHead>Toiminnot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(prompt.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {prompt.description || 'Ei kuvausta'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {prompt.createdByEmail || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevertToVersion(prompt)}
                        >
                          Palauta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Editor */}
      {showFullscreenEditor && (
        <FullscreenPromptEditor
          content={content}
          onSave={(newContent) => {
            setContent(newContent);
            setShowFullscreenEditor(false);
          }}
          onClose={() => setShowFullscreenEditor(false)}
        />
      )}
    </div>
  );
}

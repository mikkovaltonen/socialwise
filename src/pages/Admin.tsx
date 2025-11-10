import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Settings, ArrowLeft, AlertTriangle, UserPlus, Database, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PromptEditor from "../components/PromptEditor";
import SystemPromptManager from "../components/SystemPromptManager";
import UserRegistration from "@/components/UserRegistration";
import DataPreparationViewer from "@/components/DataPreparationViewer";

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToWorkbench = () => {
    navigate('/workbench');
  };

  return (
    <div className="min-h-screen bg-[#1A2332] font-sans">
      {/* Header */}
      <nav className="bg-[#1A2332]/95 backdrop-blur-md shadow-lg fixed w-full top-0 z-50 border-b border-gray-700/50">
        <div className="container mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={handleBackToWorkbench}
                className="text-gray-300 hover:text-[#FFB3A8] font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Takaisin työpöytään
              </Button>
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                    <circle cx="12" cy="8" r="2"/>
                    <circle cx="8" cy="14" r="2"/>
                    <circle cx="16" cy="14" r="2"/>
                    <circle cx="12" cy="20" r="2"/>
                    <line x1="12" y1="10" x2="12" y2="18" stroke="currentColor" strokeWidth="2"/>
                    <line x1="10" y1="9" x2="8" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="14" y1="9" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-[#FFB3A8]">SocialWise</span>
                  <span className="text-xs text-gray-400">Ylläpitopaneeli</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* User info */}
              {user && (
                <div className="text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300 font-medium">{user.email}</span>
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-300 hover:text-[#FFB3A8] font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Kirjaudu ulos
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-8 py-32">
        {/* AI Prompt Management - Featured */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    AI Järjestelmäpromptien hallinta
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    Hallitse AI-järjestelmän ohjeistuksia ja versioita
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Hallitse järjestelmäpromptin versioita. Jokainen käyttäjä voi valita haluamansa LLM-mallin (Gemini 2.5 Pro / Flash). Muutokset tallentuvat versiohistoriaan ja voidaan palauttaa tarvittaessa.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D2FDE] hover:to-[#7C3AED] py-6 text-lg font-medium shadow-lg shadow-[#7C3AED]/25"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Avaa prompttienhallinta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Järjestelmäpromptien hallinta</DialogTitle>
                    <DialogDescription>
                      Hallitse AI-järjestelmän ohjeistuksia ja mallivalintoja. Kaikki muutokset tallentuvat versiohistoriaan.
                    </DialogDescription>
                  </DialogHeader>
                  <SystemPromptManager />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-[#FFB3A8] to-[#F4A89F] text-gray-900 p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-8 w-8 text-gray-900" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Käyttäjähallinta
                  </CardTitle>
                  <p className="text-gray-800 text-lg">
                    Rekisteröi uusia käyttäjiä ja hallitse käyttöoikeuksia
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Luo uusia käyttäjätilejä sähköpostiautentikoinnilla. Käyttäjät saavat kirjautumistiedot päästäkseen SocialWise-työpöytään.
              </p>
              <Dialog open={showUserRegistration} onOpenChange={setShowUserRegistration}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-[#FFB3A8] to-[#F4A89F] hover:from-[#FFA89D] hover:to-[#F39E8E] text-gray-900 py-6 text-lg font-medium shadow-lg shadow-[#FFB3A8]/25 border-0"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Hallitse käyttäjiä
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Käyttäjähallinta</DialogTitle>
                    <DialogDescription>
                      Luo uusia käyttäjiä ja hallitse olemassa olevia käyttäjätilejä
                    </DialogDescription>
                  </DialogHeader>
                  <UserRegistration />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Data Preparation Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Datan valmistelu
                  </CardTitle>
                  <p className="text-gray-300 text-lg">
                    Tarkastele ETL-putken dokumentaatiota ja suoritushistoriaa
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Seuraa CRM-datan valmisteluprosessia, joka prosessoi asiakastietoja ja palveluhistoriaa Firestoreen. Näytä spesifikaatiot ja viimeisin suoritusraportti.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black py-6 text-lg font-medium shadow-lg shadow-gray-500/25"
                  >
                    <Database className="mr-2 h-5 w-5" />
                    Näytä prosessidokumentaatio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Datan valmisteluprosessi</DialogTitle>
                    <DialogDescription>
                      ETL-putken spesifikaatiot ja suoritushistoria
                    </DialogDescription>
                  </DialogHeader>
                  <DataPreparationViewer />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Mass Processing Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Massaprosessointi
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    Eräkäsittelyjärjestelmä asiakastietojen analysointiin
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Prosessoi suuria määriä asiakastietoja AI- ja sääntöpohjaisen logiikan avulla. Yksinkertaiset tapaukset käsitellään automaattisesti, kun taas monimutkaisemmat tapaukset analysoidaan AI:n avulla.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D2FDE] hover:to-[#7C3AED] py-6 text-lg font-medium shadow-lg shadow-[#7C3AED]/25"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Näytä prosessointilogiikka
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Massaprosessoinnin logiikka</DialogTitle>
                    <DialogDescription>
                      Miten eräkäsittelyjärjestelmä analysoi asiakastietoja
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Processing Flow</h3>
                      <pre className="bg-white p-4 rounded border border-gray-300 text-sm font-mono overflow-x-auto whitespace-pre">
{`For each substrate family:
  ├─ Load materials from stock_management collection
  ├─ Check material count
  │  ├─ If 1 material → Rule-based decision
  │  │   └─ Compare final_stock vs safety_stock
  │  │      ├─ final_stock < safety_stock → YES
  │  │      └─ final_stock >= safety_stock → NO
  │  │
  │  └─ If 2+ materials → AI analysis
  │      ├─ Load system_prompt.md
  │      ├─ Build JSON context
  │      ├─ Call OpenRouter API
  │      └─ Parse Conclusion from JSON response
  │
  └─ Update Firestore with results`}
                      </pre>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900">Key Features</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span><strong>Intelligent Processing:</strong> Single-material families use rule-based logic, multi-material families get AI analysis</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span><strong>Robust Error Handling:</strong> Automatic retry on API failures (3 attempts), resume from last saved progress</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span><strong>Progress Tracking:</strong> Real-time updates, saved progress state every 10 batches, duration tracking and ETA</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✅</span>
                          <span><strong>Shared Business Logic:</strong> Uses same system_prompt.md and AI processing logic as Chat UI</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                      <h3 className="text-lg font-semibold mb-3 text-amber-900">Database Updates</h3>
                      <p className="text-gray-700 mb-3">Each material document receives these new fields:</p>
                      <pre className="bg-white p-4 rounded border border-gray-300 text-sm font-mono overflow-x-auto">
{`{
  ai_conclusion: "YES" | "NO" | "SLIT",
  ai_output_text: string,
  ai_processed_at: "2025-10-30T...",
  ai_model: string,
  processing_method: "ai" | "rule-based"
}`}
                      </pre>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold mb-3 text-green-900">Performance</h3>
                      <p className="text-gray-700 mb-3">Estimated processing time for 1000 families:</p>
                      <ul className="space-y-1 text-gray-700 ml-4">
                        <li>• Rule-based (1 material): ~100ms per family → ~2 minutes total</li>
                        <li>• AI analysis (2-5 materials): ~2-4s per family → ~45-75 minutes total</li>
                        <li>• AI analysis (6+ materials): ~5-10s per family → ~90-180 minutes total</li>
                      </ul>
                      <p className="text-gray-600 mt-3 text-sm italic">Mixed workload estimate: 1.5 - 3 hours for 1000 families</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Location:</strong> <code className="bg-white px-2 py-1 rounded">/mass_processing/</code>
                      </p>
                      <p>
                        <strong>Documentation:</strong> See <code className="bg-white px-2 py-1 rounded">mass_processing/README.md</code> for full instructions
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Tools */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Issue Report */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Issue Report
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <p className="text-gray-600 mb-4 leading-relaxed">
                View and manage negative feedback issues from user interactions. Track resolution status.
              </p>
              <Link to="/issues">
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 py-4 font-medium shadow-lg shadow-red-500/25"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View Issues
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Admin;
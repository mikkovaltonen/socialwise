import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Settings, ArrowLeft, AlertTriangle, UserPlus, FileText, Sparkles } from "lucide-react";
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
import SummaryPromptManager from "../components/SummaryPromptManager";
import UserRegistration from "@/components/UserRegistration";
import AineistoParsingDocumentation from "@/components/AineistoParsingDocumentation";

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
                    AI Promptin ja Mallin hallinta
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    Hallitse chatbotin järjestelmäpromptia ja LLM-asetuksia (käytetään myös tiivistelmään)
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Hallitse chatbotin järjestelmäpromptin versioita. <strong>Valittu LLM-malli ja temperature käytetään sekä chatbotissa että tiivistelmän luomisessa.</strong> Muutokset tallentuvat versiohistoriaan ja voidaan palauttaa tarvittaessa.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D2FDE] hover:to-[#7C3AED] py-6 text-lg font-medium shadow-lg shadow-[#7C3AED]/25"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Avaa promptin ja mallin hallinta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>AI Promptin ja Mallin hallinta</DialogTitle>
                    <DialogDescription>
                      Hallitse chatbotin järjestelmäpromptia ja mallivalintoja. Valitut asetukset käytetään sekä chatissa että tiivistelmän luomisessa. Kaikki muutokset tallentuvat versiohistoriaan.
                    </DialogDescription>
                  </DialogHeader>
                  <SystemPromptManager />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Summary Prompt Management - Featured */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Tiivistelmän Promptin hallinta
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    Hallitse asiakastiivistelmän luomisen ohjeistusta
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Hallitse tiivistelmän luomisen järjestelmäpromptin versioita. Tiivistelmä käyttää samaa LLM-mallia ja temperature-asetusta kuin chatbot (voit vaihtaa mallin yllä olevasta osiosta). Muutokset tallentuvat versiohistoriaan.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg font-medium shadow-lg shadow-purple-600/25"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Avaa tiivistelmän promptin hallinta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tiivistelmän Promptin hallinta</DialogTitle>
                    <DialogDescription>
                      Hallitse tiivistelmän luomisen järjestelmäpromptia. Tiivistelmä käyttää samaa LLM-mallia kuin chatbot. Kaikki muutokset tallentuvat versiohistoriaan.
                    </DialogDescription>
                  </DialogHeader>
                  <SummaryPromptManager />
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

        {/* Aineisto Parsing Documentation Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Aineisto Data Parsing
                  </CardTitle>
                  <p className="text-blue-100 text-lg">
                    Tekninen dokumentaatio parsing-logiikasta
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Katso miten lastensuojelun asiakastiedot parsitaan dynaamisesti markdown-tiedostoista runtime-aikana.
                Sisältää yksityiskohtaiset parsing-säännöt, tiedostoformaatit ja esimerkkikoodit jokaiselle highlight boxille.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-lg font-medium shadow-lg shadow-blue-500/25"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Näytä parsing-dokumentaatio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Aineisto Data Parsing - Tekninen Dokumentaatio</DialogTitle>
                    <DialogDescription>
                      Runtime parsing-logiikka, tiedostoformaatit ja apufunktiot
                    </DialogDescription>
                  </DialogHeader>
                  <AineistoParsingDocumentation />
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
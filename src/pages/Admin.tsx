import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Settings, ArrowLeft, AlertTriangle, UserPlus, Database, Zap, Cpu } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100 font-sans">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={handleBackToWorkbench}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold tracking-tight text-gray-900">Massify</span>
                  <span className="text-xs text-gray-500">Admin Panel</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* User info */}
              {user && (
                <div className="text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-900 font-medium">{user.email}</span>
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
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
            <CardHeader className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    AI Prompt Version Management
                  </CardTitle>
                  <p className="text-gray-300 text-lg">
                    Manage production and testing versions of AI prompts
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Manage two versions of the system prompt: Production (stable, default for all users) and Testing (experimental features). Each user can select which version they want to use. Changes to production affect all users using the default setting.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black py-6 text-lg font-medium shadow-lg shadow-gray-500/25"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Open Prompt Manager
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>System Prompt Version Manager</DialogTitle>
                    <DialogDescription>
                      Manage production and testing versions of the AI system prompt. Each user can select which version to use.
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
            <CardHeader className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    User Management
                  </CardTitle>
                  <p className="text-blue-100 text-lg">
                    Register new users and manage account access
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Create new user accounts with email authentication and assign roles. Users will receive login credentials to access the Professional Demand Manager AI Assistant.
              </p>
              <Dialog open={showUserRegistration} onOpenChange={setShowUserRegistration}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg font-medium shadow-lg shadow-blue-600/25"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Manage Users
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader className="sr-only">
                    <DialogTitle>User Management</DialogTitle>
                    <DialogDescription>
                      Create new users and manage existing user accounts
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
            <CardHeader className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Data Preparation Pipeline
                  </CardTitle>
                  <p className="text-green-100 text-lg">
                    View ETL pipeline documentation and execution history
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Monitor the MRP data preparation pipeline that processes material stock movements and uploads to Firestore. View specifications and latest execution summary.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-6 text-lg font-medium shadow-lg shadow-green-600/25"
                  >
                    <Database className="mr-2 h-5 w-5" />
                    View Pipeline Documentation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Data Preparation Pipeline</DialogTitle>
                    <DialogDescription>
                      ETL pipeline specifications and execution history
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
            <CardHeader className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Mass Processing
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    Batch processing system for analyzing all substrate families
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-white">
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Process 1000+ substrate families through AI and rule-based logic. Single-material families use automatic rule-based decisions, while multi-material families get AI analysis via OpenRouter API.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg font-medium shadow-lg shadow-purple-600/25"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    View Processing Logic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Mass Processing Logic</DialogTitle>
                    <DialogDescription>
                      How the batch processing system analyzes substrate families
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
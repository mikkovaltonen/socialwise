import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Settings, FileText, Database, ArrowLeft, Bot, AlertTriangle, Book, Info, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DocumentAnalysis from "@/components/DocumentAnalysis";
import ChatInitViewer from "@/components/ChatInitViewer";
import { FirestoreDataTester } from "@/components/FirestoreDataTester";
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

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showChatInit, setShowChatInit] = useState(false);
  const [showFirestoreTester, setShowFirestoreTester] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToWorkbench = () => {
    navigate('/workbench');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={handleBackToWorkbench}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Admin Panel</h1>
                  <p className="text-gray-300">System Configuration & Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* User info */}
              {user && (
                <div className="text-sm text-gray-300">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white font-medium">{user.email}</span>
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* AI Prompt Management - Featured */}
        <div className="mb-8">
          <Card className="border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gray-800 text-white rounded-t-lg p-8">
              <CardTitle className="flex items-center text-2xl">
                <Settings className="mr-4 h-8 w-8" />
                AI Prompt Version Management
              </CardTitle>
              <p className="text-gray-300 mt-2 text-lg">
                Manage production and testing versions of AI prompts
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-gray-600 mb-6 text-lg">
                Manage two versions of the system prompt: Production (stable, default for all users) and Testing (experimental features). Each user can select which version they want to use. Changes to production affect all users using the default setting.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 py-4 text-lg text-white"
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
          <Card className="border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-blue-800 text-white rounded-t-lg p-8">
              <CardTitle className="flex items-center text-2xl">
                <UserPlus className="mr-4 h-8 w-8" />
                User Management
              </CardTitle>
              <p className="text-gray-300 mt-2 text-lg">
                Register new users and manage account access
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-gray-600 mb-6 text-lg">
                Create new user accounts with email authentication and assign roles. Users will receive login credentials to access the Valmet Procurement AI Assistant.
              </p>
              <Dialog open={showUserRegistration} onOpenChange={setShowUserRegistration}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-blue-800 hover:bg-blue-700 py-4 text-lg text-white"
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

        {/* Secondary Tools */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* AI Prompt Management - Moved to featured section above */}

          {/* Internal Knowledge & Chat Initialization */}
          <Card className="border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <FileText className="mr-3 h-6 w-6" />
                Internal Knowledge
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                View Valmet policies and supplier data that are automatically loaded as context for the AI assistant.
              </p>
              
              {/* Chat Initialization Viewer */}
              <Dialog open={showChatInit} onOpenChange={setShowChatInit}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-green-700 hover:bg-green-600 text-white mb-3"
                  >
                    <Book className="mr-2 h-4 w-4" />
                    View Chat Initialization Context
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Chat Initialization Context</DialogTitle>
                    <DialogDescription>
                      View and manage the policy documents that are automatically loaded as context for the AI assistant.
                    </DialogDescription>
                  </DialogHeader>
                  <ChatInitViewer />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Consolidated Data Search & Testing */}
          <Card className="border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Database className="mr-3 h-6 w-6" />
                Supplier Database Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Search the unified supplier database with ~400 verified suppliers across all categories.
              </p>
              <Dialog open={showFirestoreTester} onOpenChange={setShowFirestoreTester}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Search Procurement Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden">
                  <DialogHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle>Supplier Database Search</DialogTitle>
                        <DialogDescription>
                          Search the unified supplier database with ~400 verified suppliers, plus additional procurement data sources.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <FirestoreDataTester />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          

          {/* Issue Report */}
          <Card className="border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-3 h-6 w-6" />
                Issue Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                View and manage negative feedback issues from user interactions. Track resolution status.
              </p>
              <Link to="/issues">
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
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
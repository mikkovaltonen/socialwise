import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Brain, Upload, Shield, Zap, BarChart3, Users, ArrowRight, Check, Cloud, Server, Database, Code, Sparkles, TrendingUp, Building2, FileSearch, Bot, MessageSquare, Search, Globe, FileSpreadsheet, History, AlertCircle, TrendingDown, Package, Clock, Cpu, GitBranch, RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-gray-900">Massify</span>
            <span className="text-xs text-gray-500">Mass Tailored Proposals Platform</span>
          </div>
        </Link>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 font-medium"
            asChild
          >
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>

        <div className="container mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Proposal Automation
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Unlock Hidden Revenue from Your CRM with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Mass Tailored Proposals</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                No-code SAAS platform that empowers one marketer to identify campaign leads from CRM, calculate personalized prices, and send professional proposals to thousands of potential customers. Turn your hidden CRM data into high-conversion contract proposals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-600/25 group"
                  asChild
                >
                  <Link to="/login">
                    Start Creating Proposals
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Free trial available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">No credit card required</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="/tech_stack.png"
                alt="Massify Technology Stack - Software 1.0, 2.0, and 3.0"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold transform rotate-12 shadow-lg">
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">1000+</div>
              <div className="text-gray-600 mt-2">Proposals per Marketer</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">No-Code</div>
              <div className="text-gray-600 mt-2">Campaign Setup</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">3x</div>
              <div className="text-gray-600 mt-2">Higher Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">AI</div>
              <div className="text-gray-600 mt-2">Powered Pricing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Marketing Challenge</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your CRM holds valuable customer data, but marketers lack time to identify leads, match them to services, calculate prices, and send personalized proposals at scale.
            </p>
          </div>

          {/* Pain Points Visualization */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
            <img
              src="/painpoints.png"
              alt="Procurement Pain Points Assessment"
              className="w-full h-auto"
            />
          </div>

          {/* Pain Points Details */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Problem: Revenue Left on the Table</h3>
                    <p className="text-gray-600">Your CRM data is valuable but underutilized</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Hidden opportunities in CRM never identified</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">No time to manually match prospects to services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Complex price calculations slow down sales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Generic proposals have low conversion rates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">The Solution: AI-Powered Mass Tailoring</h3>
                    <p className="text-gray-600">No-code platform for high-conversion campaigns</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">AI identifies leads from CRM data automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Sophisticated price calculator with custom rules</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Mass generation of personalized proposals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">One marketer reaches thousands of prospects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">The Reality:</span> Marketers can only create 10-20 manual proposals per week
            </p>
            <p className="text-gray-600">
              Massify enables one marketer to send 1,000+ personalized proposals with AI-calculated pricing
            </p>
          </div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Massify Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No-code platform combining CRM integration, AI lead identification, price calculation, and mass proposal generation
            </p>
          </div>

          {/* Main Solution Diagram */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Complete Campaign Workflow</h3>
            <img
              src="/ai_development_method.png"
              alt="Forward Deployment Engineering - Right Balance of Software 1.0, 2.0, and 3.0"
              className="w-full h-auto rounded-2xl"
            />
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Campaign Designer UI</h4>
                <p className="text-sm text-gray-600">Configure campaigns, pricing rules, and email templates with no-code interface</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">AI Processing</h4>
                <p className="text-sm text-gray-600">Automatic lead identification, price calculation, and proposal personalization</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">CRM Integration</h4>
                <p className="text-sm text-gray-600">Connect to MS Dynamics CRM, Salesforce, or upload customer data files</p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Campaign Configuration</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Define Campaigns</p>
                      <p className="text-sm text-gray-600">Select service offerings and target segments from CRM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Configure Pricing Rules</p>
                      <p className="text-sm text-gray-600">No-code pricing calculator based on customer attributes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Design Email Templates</p>
                      <p className="text-sm text-gray-600">Personalized emails with PDF proposal attachments</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Human-in-the-Loop</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Review Before Send</p>
                      <p className="text-sm text-gray-600">Verify AI-generated proposals and pricing before release</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Campaign Monitoring</p>
                      <p className="text-sm text-gray-600">Track proposal delivery and response rates in real-time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Rate Limiting</p>
                      <p className="text-sm text-gray-600">Control email volume (e.g., max 1 per recipient per day)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Agent Features Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Platform Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run high-conversion mass marketing campaigns with no-code configuration
            </p>
          </div>

          {/* Radar Chart and Features */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <h3 className="text-2xl font-semibold text-gray-900 mb-8">Performance Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-medium">AI Agent Reliability</span>
                      <span className="text-purple-600 font-semibold">0-6 sigma</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-medium">Response Time</span>
                      <span className="text-blue-600 font-semibold">1-100 seconds</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-medium">Feature Scope</span>
                      <span className="text-green-600 font-semibold">1-n features</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">User experience and graphics design</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">AI leveraging collaboration and role design</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Change management friction reduction</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Dev/ops friction minimization</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-8">
                <img
                  src="/ai_agent_features.png"
                  alt="AI Agent Features Radar Chart"
                  className="w-full h-auto max-w-md"
                />
              </div>
            </div>
          </div>

          {/* Core Capabilities */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">CRM Lead Identification</h3>
                <p className="text-gray-600 mb-6">
                  AI analyzes your CRM data to identify hidden opportunities and match prospects to service offerings
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">MS Dynamics CRM integration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Automated prospect matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Opportunity prioritization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sophisticated Price Calculator</h3>
                <p className="text-gray-600 mb-6">
                  No-code pricing engine with custom rules based on customer attributes and service parameters
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Rule-based pricing logic</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Multiple pricing attributes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Personalized pricing per lead</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Mass Proposal Generation</h3>
                <p className="text-gray-600 mb-6">
                  Generate thousands of personalized proposals with custom pricing and send them via email at scale
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Personalized email content</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">PDF proposal attachments</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Campaign rate limiting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section - Software 1.0, 2.0, 3.0 */}
      <section className="py-20 px-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Software Evolution with Low TCO</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combining traditional programming, AI models, and autonomous agents for optimal results
            </p>
          </div>

          {/* Software Industry Disruption */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
            <img
              src="/distruption.png"
              alt="Software industry under disruption - Evolution from Software 1.0 to 3.0"
              className="w-full h-auto"
            />
          </div>

          {/* Main Tech Stack Visualization */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
            <img
              src="/tech_stack.png"
              alt="Software 1.0, 2.0, and 3.0 Technology Stack"
              className="w-full h-auto"
            />
          </div>

          {/* Software Versions Breakdown */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Code className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Software 1.0</h3>
                </div>
                <p className="text-gray-600 mb-4">Traditional Programming</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                    <span>JavaScript/TypeScript foundation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                    <span>Vercel serverless deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                    <span>RESTful API integration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-purple-500 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Software 2.0</h3>
                </div>
                <p className="text-gray-600 mb-4">AI Model Integration</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                    <span>Grok 4 Fast for rapid analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                    <span>Gemini 2.5 for deep understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                    <span>Multi-model orchestration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-green-500 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Software 3.0</h3>
                </div>
                <p className="text-gray-600 mb-4">Autonomous AI Agents</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5"></div>
                    <span>Self-planning agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5"></div>
                    <span>Cloud Firestore integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5"></div>
                    <span>Unstructured data processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Server className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Serverless</h4>
                <p className="text-sm text-white/80">Auto-scaling infrastructure</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Secure API</h4>
                <p className="text-sm text-white/80">Safe separation & integration</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">DevOps Excellence</h4>
                <p className="text-sm text-white/80">Continuous improvement</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">SAAS Ready</h4>
                <p className="text-sm text-white/80">REST API integration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specific AI Agent Capabilities */}
      <section className="py-20 px-8 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Agent Architecture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI agents process campaigns from configuration to delivery
            </p>
          </div>

          {/* AI Agent Architecture Diagram */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
            <img
              src="/agents.png"
              alt="Massify AI Agent Architecture - Campaign workflow from designer to verifier"
              className="w-full h-auto"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Campaign Designer */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <Settings className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Designer UI</h3>
                <p className="text-sm text-gray-600 mb-4">
                  No-code interface to configure campaigns, define pricing rules, and design email templates with PDF attachments
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Sparkles className="h-4 w-4" />
                  <span>Zero coding required</span>
                </div>
              </div>
            </div>

            {/* AI Agent Processing */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-8 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <Bot className="h-12 w-12 text-purple-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Agent Processing</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Autonomous AI identifies leads from CRM, calculates prices, and generates personalized proposals
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <Brain className="h-4 w-4" />
                  <span>Fully automated workflow</span>
                </div>
              </div>
            </div>

            {/* Campaign Verifier */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-8 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Verifier UI</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Human-in-the-loop verification interface to review and approve proposals before mass sending
                </p>
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Quality control before send</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Platform Integration Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">CRM Integration</p>
                      <p className="text-sm text-gray-600">Connect to MS Dynamics CRM or import customer data via CSV/Excel</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email Integration</p>
                      <p className="text-sm text-gray-600">Seamless email delivery with rate limiting and campaign monitoring</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Activity Tracking</p>
                      <p className="text-sm text-gray-600">Automatic logging of all campaign activities back to CRM</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                <h4 className="text-xl font-semibold mb-4">Platform Benefits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold">1000+</p>
                    <p className="text-sm text-white/80">Proposals per marketer</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">3x</p>
                    <p className="text-sm text-white/80">Higher conversion</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-sm text-white/80">Personalized pricing</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">No-Code</p>
                    <p className="text-sm text-white/80">Easy setup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Screenshot Section */}
      <section className="py-20 px-8 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See the Platform in Action</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the intuitive interface that brings AI-powered procurement to your fingertips
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden p-8">
            <img
              src="/screenshot_from_app.png"
              alt="Massify Application Interface"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Natural Language Interface</h3>
              <p className="text-sm text-gray-600">Ask questions in plain language and get instant AI-powered answers</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Data Visualization</h3>
              <p className="text-sm text-gray-600">View stock levels, forecasts, and recommendations in interactive tables</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Intelligent Automation</h3>
              <p className="text-sm text-gray-600">AI agents work autonomously to analyze data and make recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Development Method Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Right Balance Development Approach</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Forward Deployment Engineers combine Software 1.0, 2.0, and 3.0 for optimal results
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <img
                  src="/ai_development_method.png"
                  alt="AI Development Method with Forward Deployment Engineers"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
              <div className="p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-purple-50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Forward Deployment Engineering</h3>

                <div className="space-y-6 mb-8">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Build Phase</h4>
                    <p className="text-sm text-gray-600">Make predictions about AI potential, build scaffolding with Software 1.0, leverage UX/UI best practices</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Deploy Phase</h4>
                    <p className="text-sm text-gray-600">Write prompts, fine-tune AI models, collaborate on role design, ensure data quality</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Test Phase</h4>
                    <p className="text-sm text-gray-600">Continuous improvement, collect feedback, optimize AI performance, manual input reduction</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                  <p className="text-sm font-medium">
                    The right balance ensures accurate AI predictions while minimizing dev/ops friction and manual work
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-gradient-to-r from-valmet-green to-valmet-teal">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Unlock Hidden Revenue from Your CRM?
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join forward-thinking companies using AI to scale their marketing reach.
            Schedule a personalized demo to see how one marketer can send 1,000+ high-conversion proposals.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-white text-valmet-green hover:bg-gray-100 font-semibold shadow-xl"
              onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Request%20for%20Massify%20Demo&body=Hi%20Mikko,%0A%0AI%20am%20interested%20in%20learning%20more%20about%20Massify%20for%20mass%20tailored%20proposal%20generation%20and%20would%20like%20to%20schedule%20a%20demo.%0A%0ACompany:%20%0AName:%20%0ARole:%20%0ACurrent%20CRM:%20%0AAverage%20proposals%20sent%20per%20month:%20%0APreferred%20time:%20%0A%0ABest%20regards'}
            >
              Request Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-8 text-green-100">
            <p className="text-sm">
              Or contact us directly at{' '}
              <a
                href="mailto:mikko@zealsourcing.fi"
                className="underline hover:text-white transition-colors font-semibold"
              >
                mikko@zealsourcing.fi
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 lg:p-16">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-valmet-green px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Building2 className="h-4 w-4" />
                    About Zeal Sourcing
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  AI-Powered Business Solutions
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Zeal Sourcing builds cutting-edge AI solutions for businesses. Massify is our no-code SAAS platform that enables marketers to unlock hidden revenue from CRM data through mass tailored proposals.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">Forward Deployment Engineering approach</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">Software 1.0, 2.0, and 3.0 integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">AI-first no-code platforms</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="font-medium"
                    onClick={() => window.open('https://zealsourcing.fi', '_blank', 'noopener,noreferrer')}
                  >
                    Visit Website
                  </Button>
                  <Button
                    variant="outline"
                    className="font-medium"
                    onClick={() => window.open('https://linkedin.com/company/zeal-sourcing', '_blank', 'noopener,noreferrer')}
                  >
                    LinkedIn
                  </Button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-valmet-green to-valmet-teal p-12 lg:p-16 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="text-6xl font-bold bg-gradient-to-br from-valmet-green to-valmet-teal bg-clip-text text-transparent">V</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Zeal Sourcing</h3>
                  <p className="text-green-100 text-lg">Professional Procurement Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-white">Massify</span>
                  <span className="text-xs text-gray-400">Mass Tailored Proposals Platform</span>
                </div>
              </div>
              <p className="text-gray-400">
                No-code SAAS platform for AI-powered mass marketing campaigns with personalized pricing.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">API Reference</Link></li>
                <li><Link to="/under-construction" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/team" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="https://www.zealsourcing.fi" className="text-gray-400 hover:text-white transition-colors">Zeal Sourcing</a></li>
                <li><a href="https://www.linkedin.com/company/zealsourcing" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2024 Zeal Sourcing. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Massify - Mass Tailored Proposals Platform
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
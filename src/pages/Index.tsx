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
            <span className="text-xl font-semibold tracking-tight text-gray-900">Professional Demand Manager</span>
            <span className="text-xs text-gray-500">AI-Powered Procurement Automation</span>
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
                Software 3.0 - Agentic Process Automation
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Professional
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Demand Manager</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Do you have a solid ERP setup and relatively good data quality—yet your working capital still feels bloated, and delivery reliability and lead times could be better? Professional Demand Manager automates monitoring and decision support on top of your ERP database using Generative AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-blue-600/25 group"
                  onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Book%20Free%20Demo%20with%20Our%20Data&body=Hi%20Mikko,%0A%0AWe%20would%20like%20to%20book%20a%20free%20demo%20of%20Professional%20Demand%20Manager%20using%20our%20own%20data.%0A%0ACompany:%20%0AName:%20%0ARole:%20%0APreferred%20demo%20time:%20%0AType%20of%20data%20we%20want%20to%20test:%20%0A%0ABest%20regards'}
                >
                  Book Free Demo with Your Data
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Test with your own data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Free consultation</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="/solution_overview.png"
                alt="Agentic Process Automation"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold transform rotate-12 shadow-lg">
                Software 3.0
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
              <div className="text-4xl font-bold text-gray-900">78%</div>
              <div className="text-gray-600 mt-2">Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">10x</div>
              <div className="text-gray-600 mt-2">Faster Processing</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">99.9%</div>
              <div className="text-gray-600 mt-2">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 mt-2">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Current Procurement Challenges</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Even with good ERP systems, buyers face daily challenges that AI can help solve
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
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">What AI Can Solve</h3>
                    <p className="text-gray-600">Automated analysis and intelligent recommendations</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Forecast conversion from multiple sources</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Source determination optimization</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Production plan coordination</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Stock policy optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Pain Points</h3>
                    <p className="text-gray-600">Time-consuming tasks buyers face daily</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">SKU conversion between systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Material requirements planning</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Non-moving stock alerts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">Why don't you trust your MRP purchase list?</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">The Reality:</span> Buyers jump between multiple ERP modules daily
            </p>
            <p className="text-gray-600">
              Professional Demand Manager brings all these capabilities into one AI-powered interface
            </p>
          </div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Agentic Process Automation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Software 3.0 approach - AI Agent autonomously plans and executes procurement tasks
            </p>
          </div>

          {/* Main Solution Diagram */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">How Professional Demand Manager Works</h3>
            <img
              src="/solution_overview.png"
              alt="Agentic Process Automation Architecture"
              className="w-full h-auto rounded-2xl"
            />
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">User Interface</h4>
                <p className="text-sm text-gray-600">Natural language queries like "How much and what to purchase today?"</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">AI Agent Processing</h4>
                <p className="text-sm text-gray-600">Autonomous planning, execution, and self-evaluation of tasks</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">CERM-ERP Integration</h4>
                <p className="text-sm text-gray-600">Real-time data from stock, reservations, materials, and forecasts</p>
              </div>
            </div>
          </div>

          {/* DevOps Cycle */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Continuous AI Improvement</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">AI Generation</p>
                      <p className="text-sm text-gray-600">Agent creates procurement recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Human Verification</p>
                      <p className="text-sm text-gray-600">Review and approve AI suggestions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Continuous Improvement</p>
                      <p className="text-sm text-gray-600">Learn from outcomes and optimize</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <GitBranch className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">DevOps Excellence</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Automated Testing</p>
                      <p className="text-sm text-gray-600">Continuous validation of AI outputs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Version Control</p>
                      <p className="text-sm text-gray-600">Track all changes and improvements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Continuous Deployment</p>
                      <p className="text-sm text-gray-600">Seamless updates without disruption</p>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Assistant Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Balancing user experience, development efficiency, and AI capabilities
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
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Source Determination</h3>
                <p className="text-gray-600 mb-6">
                  AI identifies the most appropriate source for each order - supplier or intercompany
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Automated vendor selection</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Cost optimization</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Lead time analysis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Stock Policy AI</h3>
                <p className="text-gray-600 mb-6">
                  Intelligent recommendations for minimum stock levels and reorder points
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Dynamic min/max levels</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Non-moving stock alerts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Material optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Forecast Conversion</h3>
                <p className="text-gray-600 mb-6">
                  Transform customer forecasts into actionable material requirements
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Multi-source integration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Batch size optimization</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Production planning</span>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Agent Capabilities in Action</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI agents solve real procurement challenges autonomously
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Source Determination */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
                <img
                  src="/source_determination_ai_agent.png"
                  alt="Source Determination AI Agent"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Source Determination</h3>
                <p className="text-sm text-gray-600 mb-4">
                  AI automatically identifies the best source - supplier vs intercompany - based on cost, lead time, and availability
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Sparkles className="h-4 w-4" />
                  <span>Saves 2-3 hours per PO</span>
                </div>
              </div>
            </div>

            {/* Stock Policy */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center p-4">
                <img
                  src="/stock_policy_AI_Agent.png"
                  alt="Stock Policy AI Agent"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Policy Optimization</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Dynamic adjustments to min/max levels based on consumption patterns and lead times
                </p>
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>30% reduction in stock value</span>
                </div>
              </div>
            </div>

            {/* Forecast Conversion */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center p-4">
                <img
                  src="/Forecast_converion_AI_Agent.png"
                  alt="Forecast Conversion AI Agent"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Forecast Conversion</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Transform customer forecasts into material requirements with batch optimization
                </p>
                <div className="flex items-center gap-2 text-xs text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>95% faster than manual</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Additional AI Capabilities</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Material Width Optimization</p>
                      <p className="text-sm text-gray-600">Check widths and propose internal slitting before ordering</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Non-Moving Stock Alerts</p>
                      <p className="text-sm text-gray-600">Flag materials at risk of becoming obsolete</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Production Batch Planning</p>
                      <p className="text-sm text-gray-600">Optimize batch sizes based on costs and annual volumes</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                <h4 className="text-xl font-semibold mb-4">AI Impact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold">78%</p>
                    <p className="text-sm text-white/80">Cost reduction</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">10x</p>
                    <p className="text-sm text-white/80">Faster processing</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">99.9%</p>
                    <p className="text-sm text-white/80">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">24/7</p>
                    <p className="text-sm text-white/80">Availability</p>
                  </div>
                </div>
              </div>
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
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join leading organizations using AI to revolutionize their procurement processes. 
            Schedule a personalized demo to see how we can cut your procurement costs by 78%.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-white text-valmet-green hover:bg-gray-100 font-semibold shadow-xl"
              onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Request%20for%20ProcureAI%20Demo&body=Hi%20Mikko,%0A%0AI%20am%20interested%20in%20learning%20more%20about%20ProcureAI%20and%20would%20like%20to%20schedule%20a%20demo.%0A%0ACompany:%20%0AName:%20%0ARole:%20%0APreferred%20time:%20%0A%0ABest%20regards'}
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
                  Buying Stuff, But Better
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Zeal Sourcing transforms how businesses approach procurement. We combine deep industry expertise with cutting-edge AI technology to deliver measurable results.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">20+ years of procurement expertise</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">Trusted by Fortune 500 companies</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-valmet-green" />
                    <span className="text-gray-700">AI-first approach to procurement</span>
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
                  <span className="text-xl font-semibold text-white">Professional Demand Manager</span>
                  <span className="text-xs text-gray-400">AI-Powered Procurement Automation</span>
                </div>
              </div>
              <p className="text-gray-400">
                AI-powered procurement intelligence for modern businesses.
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
                Professional Demand Manager by Zeal Sourcing
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
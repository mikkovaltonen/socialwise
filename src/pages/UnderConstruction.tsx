import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, ArrowLeft, Cpu, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const UnderConstruction = () => {
  const navigate = useNavigate();

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
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-gray-900 font-medium"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Construction className="h-12 w-12 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Page Under Construction
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                We're currently working on this feature to bring you the best procurement automation experience. Check back soon!
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  What's Coming?
                </h2>
                <p className="text-gray-600 mb-4">
                  This section will include comprehensive documentation, pricing information, API references, and more resources to help you maximize your procurement efficiency.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  In the meantime, you can:
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                    asChild
                  >
                    <Link to="/">Return to Home</Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="font-medium"
                    onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Information%20Request'}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Us
                  </Button>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  For immediate assistance, please contact us at{' '}
                  <a
                    href="mailto:mikko@zealsourcing.fi"
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    mikko@zealsourcing.fi
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
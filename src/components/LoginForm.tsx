import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, ArrowRight } from "lucide-react";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user?.isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/workbench';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100 font-sans flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials');
      }
      
      if (success) {
        const from = (location.state as { from?: string })?.from || '/workbench';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('[LoginForm] Auth error:', err);
      setError('An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100 font-sans flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
        <CardHeader className="space-y-4 text-center p-8 bg-white rounded-t-lg">
          <Link to="/" className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Cpu className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Professional Demand Manager</h1>
              <p className="text-sm text-gray-500">AI-Powered Procurement Automation</p>
            </div>
          </Link>
          <div className="space-y-2 pt-4">
            <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
            <p className="text-gray-600">Enter your credentials to access your dashboard</p>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 font-medium shadow-lg shadow-blue-600/25 transition-all group"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to homepage
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
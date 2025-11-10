import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

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
      <div className="min-h-screen bg-[#1A2332] font-sans flex items-center justify-center">
        <div className="text-lg text-gray-400">Loading...</div>
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
    <div className="min-h-screen bg-[#1A2332] font-sans flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
        <CardHeader className="space-y-4 text-center p-8 bg-white rounded-t-lg">
          <Link to="/" className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="currentColor">
                <circle cx="12" cy="8" r="2"/>
                <circle cx="8" cy="14" r="2"/>
                <circle cx="16" cy="14" r="2"/>
                <circle cx="12" cy="20" r="2"/>
                <line x1="12" y1="10" x2="12" y2="18" stroke="currentColor" strokeWidth="2"/>
                <line x1="10" y1="9" x2="8" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="14" y1="9" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#7C3AED]">SocialWise</h1>
              <p className="text-sm text-gray-500">Sosiaalityön teknologiakumppanisi</p>
            </div>
          </Link>
          <div className="space-y-2 pt-4">
            <CardTitle className="text-3xl font-bold text-gray-900">Tervetuloa takaisin</CardTitle>
            <p className="text-gray-600">Kirjaudu sisään päästäksesi työpöytään</p>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Sähköposti</Label>
              <Input
                id="email"
                type="email"
                placeholder="nimi@organisaatio.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 border-gray-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Salasana</Label>
              <Input
                id="password"
                type="password"
                placeholder="Syötä salasanasi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 border-gray-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error === 'Invalid credentials' ? 'Virheelliset kirjautumistiedot' : error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D2FDE] hover:to-[#7C3AED] text-white h-12 font-medium shadow-lg shadow-[#7C3AED]/25 transition-all group"
              disabled={isLoading}
            >
              {isLoading ? 'Kirjaudutaan...' : (
                <>
                  Kirjaudu sisään
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-[#7C3AED] transition-colors"
              >
                ← Takaisin etusivulle
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
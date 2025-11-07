import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#1A2332] font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-[#1A2332]/95 backdrop-blur-md shadow-lg fixed w-full top-0 z-50 border-b border-gray-700/50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
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
            <span className="text-2xl font-bold tracking-tight text-[#FFB3A8]">SocialWise</span>
            <span className="text-xs text-gray-400">Sosiaalityön teknologiakumppanisi</span>
          </div>
        </Link>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-gray-300 hover:text-[#FFB3A8] font-medium transition-colors"
            asChild
          >
            <Link to="/login">Kirjaudu</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section with tag_line.png */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        <div className="container mx-auto relative">
          <div className="max-w-5xl mx-auto">
            <img
              src="/tag_line.png"
              alt="SocialWise - Sosiaalityön teknologiakumppanisi. Ihminen ja tekoäly yhdessä voimme onnistua"
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>

          <div className="mt-12 text-center max-w-3xl mx-auto space-y-6">
            <p className="text-xl text-gray-300 leading-relaxed">
              SocialWise on AI-avusteinen SAAS-alusta, joka auttaa sosiaalityöntekijöitä vähentämään kirjaamistyötä 80%, vahvistamaan oikeusturvaa ja parantamaan palvelun laatua.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FFB3A8] to-[#F4A89F] hover:from-[#FFA89D] hover:to-[#F39E8E] text-gray-900 font-semibold shadow-lg shadow-[#FFB3A8]/25 group border-0"
                asChild
              >
                <Link to="/login">
                  Aloita SocialWisen kanssa
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#FFB3A8] text-[#FFB3A8] hover:bg-[#FFB3A8]/10 font-semibold"
                onClick={() => window.location.href = 'tel:+358400413129'}
              >
                <Phone className="mr-2 h-4 w-4" />
                Ota yhteyttä
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Arvot Section with arvomme.png */}
      <section className="py-20 px-8 bg-gradient-to-b from-[#1A2332] to-[#2D3748]">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <img
              src="/arvomme.png"
              alt="Arvomme AI kehityksessä: Tietoturva, Käyttäjälähtöisyys, Luotettavuus, Eettisyys, Inspiroidu ja uudistu"
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Miksi valita meidät - hyödyt.png */}
      <section className="py-20 px-8 bg-[#2D3748]">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <img
              src="/hyödyt.png"
              alt="Miksi valita SocialWise: Kumppanina, AI apunasi, Hyödyksi"
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* SocialWisen Tarina with tarina.png */}
      <section className="py-20 px-8 bg-[#FFE5E0]">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <img
              src="/tarina.png"
              alt="SocialWisen tarina - Perustajat: Tarja Meronen, Kari Vierikka, Mikko Valtonen"
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>

          {/* Team.png jos haluat lisätä */}
          <div className="mt-12 max-w-4xl mx-auto">
            <img
              src="/team.png"
              alt="SocialWise tiimi"
              className="w-full h-auto rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ole suunnannäyttäjä!
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Anna meidän auttaa sosiaalialan ammattilaisia ja asiakkaitasi nykyaikaisella AI-teknologialla. Ota yhteyttä ja keskustellaan, miten SocialWise voi auttaa teidän organisaatiotanne.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-[#7C3AED] hover:bg-gray-100 font-semibold shadow-xl border-0"
              onClick={() => window.location.href = 'tel:+358400413129'}
            >
              <Phone className="mr-2 h-5 w-5" />
              Soita: 040 041 3129
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 font-semibold"
              onClick={() => window.location.href = 'mailto:tarja.meronen@socialwise.fi'}
            >
              <Mail className="mr-2 h-5 w-5" />
              Lähetä sähköposti
            </Button>
          </div>
        </div>
      </section>

      {/* Yhteystiedot */}
      <section className="py-20 px-8 bg-[#1A2332]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#FFB3A8] mb-4">Yhteystiedot</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-[#7C3AED]/30 shadow-2xl bg-[#2D3748]">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg viewBox="0 0 24 24" className="h-16 w-16 text-white" fill="currentColor">
                      <circle cx="12" cy="8" r="3"/>
                      <circle cx="8" cy="14" r="2.5"/>
                      <circle cx="16" cy="14" r="2.5"/>
                      <circle cx="12" cy="20" r="2.5"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-[#FFB3A8] mb-2">Tarja Meronen, FT, sostt., founder</h3>
                    <p className="text-gray-300 mb-4">Sosiaalityön asiantuntija, HR ja kaupallinen johtaja teknologiakokemuksella</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Phone className="h-5 w-5 text-[#FFB3A8]" />
                        <a href="tel:+358400413129" className="text-gray-300 hover:text-[#FFB3A8] transition-colors font-medium">
                          040 041 3129
                        </a>
                      </div>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Mail className="h-5 w-5 text-[#FFB3A8]" />
                        <a href="mailto:tarja.meronen@socialwise.fi" className="text-gray-300 hover:text-[#FFB3A8] transition-colors font-medium">
                          tarja.meronen@socialwise.fi
                        </a>
                      </div>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Building2 className="h-5 w-5 text-[#FFB3A8]" />
                        <span className="text-gray-300 font-medium">SocialWise, Espoo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F1419] py-12 border-t border-gray-800">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                    <circle cx="12" cy="8" r="2"/>
                    <circle cx="8" cy="14" r="2"/>
                    <circle cx="16" cy="14" r="2"/>
                    <circle cx="12" cy="20" r="2"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-[#FFB3A8]">SocialWise</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sosiaalityön teknologiakumppanisi. Ihminen ja tekoäly - yhdessä voimme onnistua.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#FFB3A8] mb-4">Yhteystiedot</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-400">Tarja Meronen</span></li>
                <li><a href="tel:+358400413129" className="text-gray-400 hover:text-[#FFB3A8] transition-colors">040 041 3129</a></li>
                <li><a href="mailto:tarja.meronen@socialwise.fi" className="text-gray-400 hover:text-[#FFB3A8] transition-colors">tarja.meronen@socialwise.fi</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#FFB3A8] mb-4">Linkit</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#FFB3A8] transition-colors">Omavalvonta</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FFB3A8] transition-colors">Evästeet</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#FFB3A8] transition-colors">Tietosuoja</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 SocialWise. Kaikki oikeudet pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

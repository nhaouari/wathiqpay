import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Shield, Globe, CreditCard, Mail, ArrowRight, Lock, Zap, Users, TrendingUp, Award, ChevronRight, Star } from "lucide-react";

const App = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    // Load Tally embed script
    const loadTallyScript = () => {
      if (typeof window.Tally !== "undefined") {
        window.Tally.loadEmbeds();
      } else {
        document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((iframe) => {
          iframe.src = iframe.dataset.tallySrc;
        });
      }
    };

    if (typeof window.Tally !== "undefined") {
      loadTallyScript();
    } else if (!document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://tally.so/widgets/embed.js";
      script.onload = loadTallyScript;
      script.onerror = loadTallyScript;
      document.body.appendChild(script);
    }

    // Scroll animation handler
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const certificationSteps = [
    { step: 1, title: "Dossier déposé", status: "completed", description: "Soumission via CIB Webmarchand" },
    { step: 2, title: "Validation initiale", status: "current", description: "En attente de notification" },
    { step: 3, title: "Tests techniques", status: "pending", description: "Autorisation, refus, remboursement" },
    { step: 4, title: "Procès-verbal", status: "pending", description: "Publication du PV de certification" },
    { step: 5, title: "Certification", status: "pending", description: "Attribution du certificat officiel" },
    { step: 6, title: "Production", status: "pending", description: "Mise en production finale" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-300"
              style={{ boxShadow: scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  WathiqPay
                </h1>
                <p className="text-xs text-gray-500 font-medium">Solution de paiement certifiée</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border-orange-300 px-4 py-2 animate-pulse">
              <Clock className="w-4 h-4 mr-2" />
              Certification en cours
            </Badge>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto max-w-5xl text-center relative">
          <div className="inline-flex items-center space-x-2 bg-blue-100/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 transform hover:scale-105 transition-all duration-300">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Module Node.js SATIM</span>
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
            WathiqPay
            <span className="block text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4">
              Module Node.js en cours de certification SATIM
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
            Nous avons soumis notre dossier de demande de certification via le portail{" "}
            <span className="font-semibold text-blue-600 underline decoration-2 decoration-blue-400 underline-offset-4">CIB Webmarchand</span>. 
            Dès approbation, nous entrerons dans la phase de test sandbox, conformément au processus officiel 
            d'homologation en huit étapes.
          </p>
          
          {/* Enhanced security badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {[
              { icon: Shield, text: "Sécurisé PCI-DSS", color: "green" },
              { icon: Globe, text: "3-D Secure", color: "blue" },
              { icon: Lock, text: "HMAC-SHA-256", color: "purple" },
              { icon: Zap, text: "HTTPS Protocol", color: "orange" }
            ].map((item, index) => (
              <div key={index} 
                   className="group flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <div className={`w-10 h-10 bg-${item.color}-100 rounded-full flex items-center justify-center group-hover:bg-${item.color}-200 transition-colors duration-300`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            Découvrir notre solution
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Certification Timeline */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Processus de certification
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Suivez notre progression vers la certification SATIM officielle
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-400 via-blue-400 to-gray-300"></div>
            
            {/* Timeline items */}
            <div className="space-y-12">
              {certificationSteps.map((item, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <Card className={`transform transition-all duration-500 hover:scale-105 ${
                      item.status === 'completed' ? 'border-green-200 bg-green-50' : 
                      item.status === 'current' ? 'border-blue-200 bg-blue-50 animate-pulse' : 
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <CardContent className="p-6">
                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                        <p className="text-gray-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-500' : 
                      item.status === 'current' ? 'bg-blue-500 animate-pulse' : 
                      'bg-gray-300'
                    } text-white font-bold shadow-lg`}>
                      {item.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : item.step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Why SATIM Certification */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi la certification SATIM ?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une garantie de sécurité et de conformité pour vos transactions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-10">
                  <Award className="w-16 h-16 text-blue-600 mb-6" />
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">Exigence incontournable</h4>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    La certification est requise pour activer la production avec les banques 
                    algériennes membres du <span className="font-semibold text-blue-600">GIE Monétique</span>, 
                    notamment BDL, CPA et BNA.
                  </p>
                  <div className="space-y-3">
                    {['Chiffrement HMAC‑SHA‑256', 'Protocole HTTPS', 'Compliance PCI‑DSS', '3‑D Secure'].map((item, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: "Sécurité maximale", desc: "Protection des données" },
                { icon: Users, title: "Confiance bancaire", desc: "Approuvé par les banques" },
                { icon: TrendingUp, title: "Performance", desc: "Transactions rapides" },
                { icon: Lock, title: "Conformité", desc: "Standards internationaux" }
              ].map((item, i) => (
                <Card key={i} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-2">{item.title}</h5>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How it Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Comment cela fonctionne ?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Un processus simple et sécurisé pour vos paiements en ligne
            </p>
          </div>
          
          <div className="relative">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Redirection sécurisée", desc: "Vers la page de paiement SATIM/IPAY", icon: Globe },
                { step: "2", title: "Transmission des données", desc: "Au système bancaire sécurisé", icon: Shield },
                { step: "3", title: "Statut instantané", desc: "Accepté/Refusé/Réclamé dans votre back-office", icon: Zap }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white">
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <item.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {item.step}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                  {i < 2 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Benefits */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que cela signifie pour vous
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les avantages de notre solution certifiée
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Module certifié Node.js",
                desc: "Anticipez l'arrivée d'un module certifié compatible Node.js pour accepter les cartes CIB & Edahabia.",
                color: "green",
                gradient: "from-green-400 to-emerald-600"
              },
              {
                icon: Shield,
                title: "Sécurité garantie",
                desc: "Tous les critères essentiels de sécurité et de conformité SATIM sont respectés, sans divulguer de détails techniques sensibles.",
                color: "blue",
                gradient: "from-blue-400 to-indigo-600"
              },
              {
                icon: Mail,
                title: "Notification prioritaire",
                desc: "Inscrivez-vous à notre liste d'attente pour être informé dès la mise en production finale — un seul message, sans spam.",
                color: "purple",
                gradient: "from-purple-400 to-pink-600"
              }
            ].map((item, i) => (
              <Card key={i} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Form */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
            <Star className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-semibold text-white">Inscription prioritaire</span>
            <Star className="w-5 h-5 text-yellow-300" />
          </div>
          
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Inscrivez-vous dès maintenant
          </h3>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Laissez votre e-mail pour recevoir la notification de lancement. 
            Aucun spam, uniquement l'alerte officielle dès que SATIM délivrera le certificat.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
            <iframe 
              data-tally-src="https://tally.so/embed/3yav5p?alignLeft=1&hideTitle=1&transparentBackground=0&dynamicHeight=1" 
              loading="lazy" 
              width="100%" 
              height="589" 
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0" 
              title="WathiqPay Contact Form"
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;

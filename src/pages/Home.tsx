import React, { useEffect } from 'react';
import { Sparkles, Leaf, Shield, Clock, Star, ArrowRight, Play, ChevronRight, Award, Users, Zap } from 'lucide-react';
import { generateToken } from '../notifications/firebase';

export function Home() {
  useEffect(() => {
    generateToken();
  }, []);
  return (
    <main className="relative">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[url('')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/80 to-white/40"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 hover:bg-primary/20 transition-all cursor-pointer group animate-fade-in">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Découvrez la révolution des soins de la peau</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Transformez Votre Peau avec
            <span className="gradient-text block mt-2">PlasmaCare</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in delay-100">
            Expérimentez des traitements personnalisés avec notre technologie plasma avancée.
            Votre voyage vers une peau radieuse et saine commence ici.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in delay-200">
            <button className="btn-primary group">
              Réserver une Consultation
              <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-outline group">
              Regarder la vidéo
              <Play className="inline-block ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Hero Image Section */}
          <div className="relative mx-auto max-w-5xl animate-fade-in delay-300">
            {/* Floating Stats */}
            <div className="absolute top-4 right-4 md:-top-4 md:-right-4 bg-white rounded-2xl shadow-lg p-4 z-10 animate-float">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">Note moyenne: 4.9/5</span>
              </div>
            </div>

            {/* Floating Achievement */}
            <div className="absolute top-4 left-4 md:-top-4 md:-left-4 bg-white rounded-2xl shadow-lg p-4 z-10 animate-float delay-150">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold">N°1 en France</span>
              </div>
            </div>

            {/* Main Image with Gradient Overlay */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10"></div>
              <img 
                src="https://studiokanea.fr/wp-content/uploads/2024/10/DALL%C2%B7E-2024-10-25-09.50.52-An-extreme-close-up-of-a-beauty-salon-facial-treatment-using-Russian-cold-plasma-therapy-on-a-client.-The-camera-angle-is-at-a-45-degree-angle-from-th-copie.jpg"
                alt="Traitement PlasmaCare"
                className="w-full transform hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Stats Bar */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-lg p-6 w-[90%] md:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
                <div className="text-center">
                  <div className="font-bold text-3xl text-primary">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Client</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-primary">5000+</div>
                  <div className="text-sm text-gray-600">Traitements Réalisés</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-primary">15+</div>
                  <div className="text-sm text-gray-600">Années d'Expertise</div>
                </div>
              </div>
            </div>
          </div>

          

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-32">
            <div className="feature-card group">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Soins Personnalisés</h3>
              <p className="text-gray-600 mb-6">
                Plans de traitement sur mesure adaptés à vos besoins uniques et à vos objectifs cutanés.
              </p>
              <a href="#" className="inline-flex items-center text-primary group/link">
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
            
            <div className="feature-card group">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Technologie Avancée</h3>
              <p className="text-gray-600 mb-6">
                Thérapie plasma froid de pointe pour des résultats optimaux et une peau éclatante.
              </p>
              <a href="#" className="inline-flex items-center text-primary group/link">
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
            
            <div className="feature-card group">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Accompagnement Expert</h3>
              <p className="text-gray-600 mb-6">
                Support professionnel tout au long de votre parcours de soins de la peau.
              </p>
              <a href="#" className="inline-flex items-center text-primary group/link">
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mt-32 text-center">
            <p className="text-sm text-gray-500 mb-8">Ils nous font confiance</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute -top-1 -left-1 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80"
                    alt="Sarah M."
                    className="relative w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                  />
                </div>
                <p className="font-medium">Sarah M.</p>
                <p className="text-sm text-gray-500">Cliente depuis 2 ans</p>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute -top-1 -left-1 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&h=300&q=80"
                    alt="Emma L."
                    className="relative w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                  />
                </div>
                <p className="font-medium">Emma L.</p>
                <p className="text-sm text-gray-500">Cliente depuis 1 an</p>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute -top-1 -left-1 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&h=300&q=80"
                    alt="Sophie D."
                    className="relative w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                  />
                </div>
                <p className="font-medium">Sophie D.</p>
                <p className="text-sm text-gray-500">Cliente depuis 6 mois</p>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
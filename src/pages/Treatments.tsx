import React from 'react';
import { Zap, Shield, Clock, Star, ArrowRight } from 'lucide-react';

export function Treatments() {
  const treatments = [
    {
      title: "Traitement Anti-âge Plasma",
      description: "Réduction visible des rides et ridules grâce à notre technologie plasma de pointe.",
      duration: "60 min",
      price: "250€",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "Lifting Non-chirurgical",
      description: "Raffermissement cutané et amélioration de l'élasticité sans chirurgie.",
      duration: "45 min",
      price: "200€",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1570554886105-71da8c37def8?auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "Traitement des Taches Pigmentaires",
      description: "Uniformisation du teint et réduction des taches brunes.",
      duration: "30 min",
      price: "180€",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=2000&q=80"
    }
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Nos Traitements
            <span className="gradient-text block mt-2">Personnalisés</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez notre gamme complète de traitements innovants, conçus pour répondre à vos besoins spécifiques.
          </p>
        </div>

        {/* Treatment Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {treatments.map((treatment, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                <img 
                  src={treatment.image} 
                  alt={treatment.title}
                  className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{treatment.duration}</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{treatment.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-3">{treatment.title}</h3>
                <p className="text-gray-600 mb-6">{treatment.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{treatment.price}</span>
                  <button className="btn-primary">
                    Réserver
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-16">Pourquoi Choisir PlasmaCare ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Technologie Avancée</h3>
              <p className="text-gray-600">
                Équipements de dernière génération pour des résultats optimaux.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sécurité Garantie</h3>
              <p className="text-gray-600">
                Protocoles rigoureux et équipe hautement qualifiée.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Résultats Durables</h3>
              <p className="text-gray-600">
                Des effets visibles et qui durent dans le temps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
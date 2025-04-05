import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

export function Results() {
  const beforeAfterResults = [
    {
      title: "Traitement Anti-âge",
      description: "Réduction significative des rides après 3 séances",
      beforeImage: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
      afterImage: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      testimonial: "Résultats impressionnants dès la première séance"
    },
    {
      title: "Lifting Non-chirurgical",
      description: "Amélioration visible de la fermeté de la peau",
      beforeImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80",
      afterImage: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      testimonial: "Un rajeunissement naturel et durable"
    }
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Nos Résultats
            <span className="gradient-text block mt-2">Avant/Après</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les transformations réelles obtenues grâce à nos traitements innovants.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid lg:grid-cols-2 gap-12">
          {beforeAfterResults.map((result, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold">{result.title}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{result.rating}</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="relative">
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                      Avant
                    </span>
                    <img 
                      src={result.beforeImage} 
                      alt="Avant traitement"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">
                      Après
                    </span>
                    <img 
                      src={result.afterImage} 
                      alt="Après traitement"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{result.description}</p>
                
                <div className="flex items-center justify-between">
                  <p className="italic text-gray-500">"{result.testimonial}"</p>
                  <button className="btn-primary">
                    En savoir plus
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-32 grid md:grid-cols-4 gap-8">
          <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <p className="text-gray-600">Taux de satisfaction</p>
          </div>
          <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
            <div className="text-4xl font-bold text-primary mb-2">5000+</div>
            <p className="text-gray-600">Traitements réalisés</p>
          </div>
          <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
            <div className="text-4xl font-bold text-primary mb-2">15+</div>
            <p className="text-gray-600">Années d'expérience</p>
          </div>
          <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
            <div className="text-4xl font-bold text-primary mb-2">4.9</div>
            <p className="text-gray-600">Note moyenne</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Star, Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah M.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80",
      role: "Cliente depuis 2 ans",
      text: "Les traitements PlasmaCare ont complètement transformé ma peau. Je n'ai jamais eu autant confiance en moi ! L'équipe est professionnelle et attentionnée.",
      rating: 5,
      treatment: "Traitement Anti-âge"
    },
    {
      name: "Emma L.",
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&h=300&q=80",
      role: "Cliente depuis 1 an",
      text: "L'équipe est incroyablement professionnelle et les résultats dépassent toutes mes attentes. Je recommande vivement !",
      rating: 5,
      treatment: "Lifting Non-chirurgical"
    },
    {
      name: "Sophie D.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&h=300&q=80",
      role: "Cliente depuis 6 mois",
      text: "Une expérience exceptionnelle ! Les résultats sont visibles dès les premières séances. Le personnel est à l'écoute et très compétent.",
      rating: 5,
      treatment: "Traitement des Taches"
    }
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Témoignages
            <span className="gradient-text block mt-2">Clients</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les expériences de nos clients satisfaits et leurs transformations avec PlasmaCare.
          </p>
        </div>

        {/* Featured Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card group">
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-20 h-20 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors"></div>
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="relative w-20 h-20 rounded-full mx-auto mb-6 object-cover ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all"
                />
                <div className="absolute top-0 right-0 flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                <p className="text-gray-600 italic mb-6 text-lg">
                  {testimonial.text}
                </p>
              </div>

              <div className="mt-6">
                <p className="font-semibold text-lg">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
                <div className="mt-2 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {testimonial.treatment}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Testimonials */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">Témoignages Vidéo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative rounded-3xl overflow-hidden aspect-video group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=2000&q=80"
                alt="Témoignage vidéo"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1"></div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 text-white z-20">
                <h3 className="text-xl font-semibold mb-2">L'expérience PlasmaCare</h3>
                <p className="text-white/80">Marie P. nous raconte son parcours</p>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden aspect-video group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
              <img 
                src="https://la-woman-mag.com/wp-content/uploads/2021/03/Copie-de-empowerment-femme-17.jpg"
                alt="Témoignage vidéo"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1"></div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 text-white z-20">
                <h3 className="text-xl font-semibold mb-2">Résultats Spectaculaires</h3>
                <p className="text-white/80">Julie M. partage sa transformation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
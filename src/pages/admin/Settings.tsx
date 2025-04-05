import React from 'react';
import { Save } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Paramètres généraux</h2>
          <p className="text-sm text-gray-500">
            Configurez les paramètres généraux de l'application
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'établissement
            </label>
            <input
              type="text"
              className="input"
              placeholder="PlasmaCare"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de contact
            </label>
            <input
              type="email"
              className="input"
              placeholder="contact@plasmacare.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              className="input"
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="123 rue Example, 75000 Paris"
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { treatments, products } from '../../lib/api';

export function TreatmentsList() {
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    category: 'other' as 'alopecie' | 'blepharochalasis' | 'other'
  });
  const [productsList, setProductsList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadTreatments();
    loadProducts();
  }, []);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const data = await treatments.getAll();
      setTreatmentsList(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await products.getAll();
      setProductsList(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des produits:', err);
    }
  };

  const loadTreatmentProducts = async (treatmentId: string) => {
    try {
      const { data: treatmentProducts } = await treatments.getProducts(treatmentId);

      if (treatmentProducts) {
        setSelectedProducts(treatmentProducts.map(tp => tp.product_id));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des produits associés:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingId) {
        await treatments.update(editingId, formData);
      } else {
        await treatments.create(formData);
      }
      
      // Mettre à jour les associations avec les produits
      const existingProducts = await treatments.getProducts(editingId || '');
      const existingProductIds = existingProducts?.map(p => p.product_id) || [];
      const productsToAdd = selectedProducts.filter(id => !existingProductIds.includes(id));
      const productsToRemove = existingProductIds.filter(id => !selectedProducts.includes(id));

      // Supprimer les associations obsolètes
      if (productsToRemove.length > 0) {
        await treatments.removeProducts(editingId || '', productsToRemove);
      }

      // Ajouter les nouvelles associations
      if (productsToAdd.length > 0) {
        await treatments.addProducts(editingId || '', productsToAdd);
      }

      resetForm();
      loadTreatments();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (treatment: any) => {
    setFormData({
      name: treatment.name,
      description: treatment.description || '',
      duration: treatment.duration,
      price: treatment.price,
      category: treatment.category
    });
    setEditingId(treatment.id);
    loadTreatmentProducts(treatment.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce traitement ?')) {
      try {
        await treatments.delete(id);
        loadTreatments();
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      category: 'other'
    });
    setEditingId(null);
    setSelectedProducts([]);
    setShowForm(false);
  };

  if (loading && treatmentsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Traitements</h1>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" />
          Nouveau traitement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadTreatments}
            className="mt-2 text-sm font-medium hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Modifier le traitement' : 'Nouveau traitement'}
            </h2>
            <button 
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du traitement
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input h-24"
                  placeholder="Description du traitement..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="input"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (€)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="alopecie">Alopécie</option>
                  <option value="blepharochalasis">Blépharochalasis</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produits associés
                </label>
                <select
                  multiple
                  value={selectedProducts}
                  onChange={(e) => setSelectedProducts(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
                  className="input"
                >
                  {productsList.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Chargement...' : editingId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {treatmentsList.length > 0 ? (
          treatmentsList.map((treatment: any) => (
            <div key={treatment.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{treatment.name}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => handleEdit(treatment)}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => handleDelete(treatment.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {treatment.description || 'Aucune description'}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{treatment.duration} min</span>
                <span className="font-medium">{treatment.price}€</span>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {treatment.category}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">Aucun traitement trouvé</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary hover:text-primary-dark"
            >
              Ajouter un traitement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
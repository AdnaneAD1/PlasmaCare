import React, { useState, useEffect } from 'react';
import { Users, User, TrendingUp, Calendar, FileText, Sparkles, Search, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api';

interface StatsCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsCard[]>([
    {
      title: "Utilisateurs",
      value: 0,
      description: "Total des utilisateurs",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: "Rendez-vous",
      value: 0,
      description: "Cette semaine",
      icon: <Calendar className="w-6 h-6 text-green-500" />,
      trend: {
        value: 8,
        isPositive: true
      }
    },
    {
      title: "Chiffre d'affaires",
      value: "0 €",
      description: "Rendez-vous confirmés",
      icon: <DollarSign className="w-6 h-6 text-emerald-500" />,
      trend: {
        value: 15,
        isPositive: true
      }
    },
    {
      title: "Traitements",
      value: 0,
      description: "Actifs",
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      trend: {
        value: 5,
        isPositive: true
      }
    }
  ]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await admin.getAllUsers();
      setUsers(users);
      
      // Update stats with real data
      const dashboardStats = await admin.getStats();
      
      if (dashboardStats) {
        setStats([
          {
            title: "Utilisateurs",
            value: dashboardStats.total_users || 0,
            description: "Total des utilisateurs",
            icon: <Users className="w-6 h-6 text-blue-500" />,
            trend: {
              value: 12,
              isPositive: true
            }
          },
          {
            title: "Rendez-vous",
            value: dashboardStats.total_appointments || 0,
            description: "Total des rendez-vous",
            icon: <Calendar className="w-6 h-6 text-green-500" />,
            trend: {
              value: 8,
              isPositive: true
            }
          },
          {
            title: "Chiffre d'affaires",
            value: `${dashboardStats.total_revenue || 0} €`,
            description: "Rendez-vous confirmés",
            icon: <DollarSign className="w-6 h-6 text-emerald-500" />,
            trend: {
              value: 15,
              isPositive: true
            }
          },
          {
            title: "Traitements",
            value: dashboardStats.total_treatments || 0,
            description: "Actifs",
            icon: <Sparkles className="w-6 h-6 text-amber-500" />,
            trend: {
              value: 5,
              isPositive: true
            }
          }
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user: any) => {
    if (!searchTerm) return true;
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                {stat.icon}
              </div>
              {stat.trend && (
                <div className={`flex items-center text-sm ${
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    !stat.trend.isPositive && 'transform rotate-180'
                  }`} />
                  {stat.trend.value}%
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.description}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadData}
            className="mt-2 text-sm font-medium hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold">Utilisateurs récents</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.is_admin && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-primary hover:text-primary-dark"
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Camera, TrendingUp, Wallet, LogOut, Upload, DollarSign } from 'lucide-react';

const API_BASE_URL = 'https://web-production-65513.up.railway.app/api';

export default function KaratApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Receipt upload
  const [receiptAmount, setReceiptAmount] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      fetchDashboard(savedToken);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const body = isLogin 
        ? { email, password }
        : { email, password, name };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      fetchDashboard(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  };

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPortfolio(data.holdings || []);
    } catch (err) {
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create a simple 1x1 pixel image as placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      const formData = new FormData();
      formData.append('receipt_image', blob, 'receipt.png');
      formData.append('amount', receiptAmount);
      formData.append('store_name', storeName);
      formData.append('is_featured', isFeatured);

      const response = await fetch(`${API_BASE_URL}/receipts/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert(`Receipt uploaded! You earned ${data.receipt.points} points ($${data.receipt.share_value.toFixed(2)} in shares) + $${data.receipt.round_up.toFixed(2)} round-up!`);
      
      setReceiptAmount('');
      setStoreName('');
      setIsFeatured(false);
      fetchDashboard(token);
      setActiveView('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setDashboard(null);
    setPortfolio([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    if (activeView === 'portfolio' && isAuthenticated) {
      fetchPortfolio();
    }
  }, [activeView, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Karat
            </h1>
            <p className="text-gray-600 text-sm">Invest your spare change & earn rewards</p>
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1 rounded-full inline-block">
              ⚠️ Simulated Trading - No Real Money
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                isLogin ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                !isLogin ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree this is a simulated demo for testing purposes only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Karat</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>

          <p className="text-sm opacity-90 mb-4">Welcome back, {user?.name}!</p>

          {dashboard && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-xs opacity-90">Round-Up Balance</div>
                <div className="text-2xl font-bold">${dashboard.roundup_balance?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-xs opacity-90">Total Points</div>
                <div className="text-2xl font-bold">{dashboard.total_points?.toLocaleString() || '0'}</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 col-span-2">
                <div className="text-xs opacity-90">Portfolio Value</div>
                <div className="text-2xl font-bold">${dashboard.portfolio_value?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-around py-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center ${activeView === 'dashboard' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <TrendingUp size={24} />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('upload')}
            className={`flex flex-col items-center ${activeView === 'upload' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <Camera size={24} />
            <span className="text-xs mt-1">Upload</span>
          </button>
          <button
            onClick={() => setActiveView('portfolio')}
            className={`flex flex-col items-center ${activeView === 'portfolio' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <Wallet size={24} />
            <span className="text-xs mt-1">Portfolio</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {activeView === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">How Karat Works</h2>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>Upload receipts to earn points (25+ points per receipt = fractional stock shares)</div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>Each purchase rounds up to the nearest dollar - spare change goes to your investment balance</div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>Use your round-up balance to buy any stocks you want</div>
                </div>
              </div>
            </div>

            {dashboard?.recent_receipts && dashboard.recent_receipts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                {dashboard.recent_receipts.map((receipt) => (
                  <div key={receipt.id} className="border-b last:border-0 py-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{receipt.store}</div>
                        <div className="text-xs text-gray-500">{receipt.date} • ${receipt.amount.toFixed(2)}</div>
                      </div>
                      {receipt.is_featured && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Bonus!</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 rounded px-2 py-1">
                        <span className="text-gray-600">Round-up:</span>
                        <span className="font-semibold text-green-700 ml-1">${receipt.round_up.toFixed(2)}</span>
                      </div>
                      <div className="bg-purple-50 rounded px-2 py-1">
                        <span className="text-gray-600">Shares:</span>
                        <span className="font-semibold text-purple-700 ml-1">${receipt.share_value.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'upload' && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4">Upload Receipt</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enter your receipt details to earn points and round-up savings!
            </p>

            <form onSubmit={handleReceiptUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Target, Walmart, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="47.23"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Contains featured brand items (earn bonus points!)
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                {loading ? 'Uploading...' : 'Upload Receipt'}
              </button>
            </form>

            <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm">
              <div className="font-semibold text-blue-900 mb-2">💡 How Points Work:</div>
              <ul className="space-y-1 text-blue-800">
                <li>• Every receipt: 25 points minimum ($0.25 in stock)</li>
                <li>• Featured brands: +150-500 bonus points!</li>
                <li>• 100 points = $1.00 in stock shares</li>
              </ul>
            </div>
          </div>
        )}

        {activeView === 'portfolio' && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4">My Portfolio</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : portfolio.length === 0 ? (
              <div className="text-center py-8">
                <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No holdings yet. Upload receipts to start earning shares!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio.map((holding, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-lg">{holding.symbol}</div>
                        <div className="text-sm text-gray-600">{holding.shares.toFixed(6)} shares</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {holding.source === 'receipt' ? '📸 Receipt rewards' : 
                           holding.source === 'roundup' ? '💰 Round-ups' : '💰📸 Mixed'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">${holding.value.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">${holding.current_price.toFixed(2)}/share</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Portfolio Value</span>
                    <span className="text-purple-600">
                      ${portfolio.reduce((sum, h) => sum + h.value, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

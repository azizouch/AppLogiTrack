
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();

  // Reset form state when component mounts (after logout)
  useEffect(() => {
    // Reset all local state
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRememberMe(false);
    setLoading(false);
    setError('');

    // Force cleanup of any stuck modal/dialog styles on login page load
    if (typeof window !== 'undefined') {
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('overflow');
      document.body.removeAttribute('data-scroll-locked');
    }

    // Show logout success message if user was just logged out
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'success') {
      toast.success('Déconnexion réussie', {
        description: 'Vous avez été déconnecté avec succès',
        duration: 3000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Show password reset success message
    if (urlParams.get('password-reset') === 'success') {
      toast.success('Mot de passe mis à jour !', {
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe',
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      toast.success('Connexion réussie ! Bienvenue dans LogiTrack', {
        description: 'Vous êtes maintenant connecté à votre compte',
        duration: 4000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error: any) {
      let errorMessage = 'Erreur de connexion. Veuillez réessayer.';

      if (error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (error?.message?.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto animate-fade-in-down">
        {/* Logo Section outside card */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* LogiTrack title inside card */}
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">LogiTrack</h1>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Connexion
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                Entrez vos identifiants pour accéder à votre compte
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  style={{ height: '2.5rem' }}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                    Mot de passe
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    disabled={loading}
                  >
                    Mot de passe oublié?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pr-10"
                    style={{ height: '2.5rem' }}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-300">
                  Se souvenir de moi
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full relative overflow-hidden bg-blue-600 text-white text-base font-medium border-0 transition-all duration-300 hover:shadow-lg group"
                style={{ height: '2.5rem' }}
                disabled={loading}
              >
                <span className="absolute inset-0 bg-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Connexion en cours...
                    </div>
                  ) : (
                    'Se connecter'
                  )}
                </span>
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Problème de connexion ? <a href="mailto:admin@logitrack.com" className="text-blue-600 dark:text-blue-400 hover:underline">Contactez votre administrateur</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}

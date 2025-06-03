import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initializePasswordReset = async () => {
      // Get URL parameters from both search params and hash
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check for parameters in both locations
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = urlParams.get('type') || hashParams.get('type');
      const token = urlParams.get('token') || hashParams.get('token');

      // Debug: log all URL information
      console.log('Reset Password Debug:', {
        currentURL: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        accessToken,
        refreshToken,
        type,
        token,
        searchParams: Object.fromEntries(urlParams.entries()),
        hashParams: Object.fromEntries(hashParams.entries())
      });

      // Check if this is a password recovery request
      if (type === 'recovery' || accessToken) {
        console.log('Valid reset password request detected');

        // If we have tokens, try to set the session
        if (accessToken && refreshToken) {
          try {
            console.log('Setting session with tokens...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('Session error:', error);
              toast.error('Lien de réinitialisation invalide ou expiré', {
                description: 'Veuillez demander un nouveau lien de réinitialisation.',
                icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              });
              navigate('/');
              return;
            }

            console.log('Session set successfully');
            toast.success('Lien de réinitialisation validé', {
              description: 'Vous pouvez maintenant définir votre nouveau mot de passe.',
              icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            });
          } catch (error) {
            console.error('Error setting session:', error);
            toast.error('Erreur lors de la validation du lien', {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            });
            navigate('/');
            return;
          }
        } else if (type === 'recovery') {
          // Even without tokens, if type is recovery, allow the form to show
          console.log('Recovery type detected, allowing password reset form');
          toast.success('Lien de réinitialisation validé', {
            description: 'Vous pouvez maintenant définir votre nouveau mot de passe.',
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
        }

        // If we reach here, the reset link is valid
        return;
      }

      // If no valid parameters found, show warning but allow form for testing
      console.log('No valid reset parameters found');
      toast.error('Lien de réinitialisation invalide ou expiré', {
        description: 'Veuillez demander un nouveau lien de réinitialisation.',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });

      // Allow the form to show even with invalid tokens for better UX
    };

    initializePasswordReset();
  }, [searchParams, navigate]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success('Mot de passe mis à jour avec succès !', {
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/?password-reset=success');
      }, 2000);

    } catch (error: any) {
      let errorMessage = 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.';

      if (error?.message?.includes('New password should be different')) {
        errorMessage = 'Le nouveau mot de passe doit être différent de l\'ancien';
      } else if (error?.message?.includes('Password should be at least')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (error?.message?.includes('Unable to validate email address')) {
        errorMessage = 'Session expirée. Veuillez demander un nouveau lien de réinitialisation.';
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-down">
        {/* Logo Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center space-y-4 pb-6">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">LogiTrack</h1>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Lock className="h-6 w-6" />
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                Choisissez un nouveau mot de passe sécurisé pour votre compte
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
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                  Nouveau mot de passe
                </Label>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pr-10"
                    style={{ height: '2.5rem' }}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                      Mise à jour...
                    </div>
                  ) : (
                    'Mettre à jour le mot de passe'
                  )}
                </span>
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
                disabled={loading}
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

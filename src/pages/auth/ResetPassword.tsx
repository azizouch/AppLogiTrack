import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import { auth, supabase } from '@/lib/supabase';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Supabase auth session from URL
  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        // Log the full URL for debugging
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));

        // Supabase automatically handles the session from URL hash
        // We just need to check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('Current session:', session);
        console.log('Session error:', error);

        if (error) {
          console.error('Session error:', error);
          toast.error('Lien de réinitialisation invalide', {
            description: 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.',
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          });
          navigate('/');
          return;
        }

        if (!session) {
          // Try to get session from URL hash (Supabase format)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          console.log('Hash params - Access token:', accessToken);
          console.log('Hash params - Refresh token:', refreshToken);
          console.log('Hash params - Type:', type);

          if (accessToken && refreshToken && type === 'recovery') {
            // Set the session manually
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              toast.error('Lien de réinitialisation invalide', {
                description: 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.',
                icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              });
              navigate('/');
              return;
            }
          } else {
            toast.error('Lien de réinitialisation invalide', {
              description: 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.',
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            });
            navigate('/');
            return;
          }
        }

        // If we get here, we have a valid session for password reset
        console.log('Valid session found, ready for password reset');
        setValidatingSession(false);

      } catch (error) {
        console.error('Error handling auth session:', error);
        toast.error('Erreur lors de la validation du lien', {
          description: 'Une erreur est survenue. Veuillez réessayer.',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
        navigate('/');
      }
    };

    handleAuthSession();
  }, [searchParams, navigate]);

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

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // Update password using Supabase directly
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success('Mot de passe mis à jour !', {
        description: 'Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.',
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      // Sign out the user and redirect to login with success parameter
      await supabase.auth.signOut();
      navigate('/?password-reset=success');

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

  // Show loading while validating session
  if (validatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Validation du lien de réinitialisation...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-full">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Choisissez un nouveau mot de passe sécurisé pour votre compte
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              )}

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
                    minLength={6}
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
                    minLength={6}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Mise à jour en cours...
                  </div>
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

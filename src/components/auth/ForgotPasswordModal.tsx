import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/supabase';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse email', {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Veuillez entrer une adresse email valide', {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await auth.resetPassword(email);

      if (error) {
        throw error;
      }

      setSent(true);
      toast.success('Email de réinitialisation envoyé !', {
        description: 'Vérifiez votre boîte de réception et suivez les instructions.',
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.';
      
      if (error?.message?.includes('User not found')) {
        errorMessage = 'Aucun compte trouvé avec cette adresse email';
      } else if (error?.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.';
      }

      toast.error(errorMessage, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Mot de passe oublié
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {sent 
              ? "Un email de réinitialisation a été envoyé à votre adresse."
              : "Entrez votre adresse email pour recevoir un lien de réinitialisation."
            }
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-gray-700 dark:text-gray-300">
                Adresse email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                disabled={loading}
                autoFocus
              />
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer le lien'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Email envoyé avec succès !
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Vérifiez votre boîte de réception et vos spams.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth";
import { LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      setEmail("");
      setPassword("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleInputClick = (inputRef: React.RefObject<HTMLInputElement>) => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-0 overflow-hidden'>
        <div className='p-6 pb-8 pt-12'>
          <div className='flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8'>
            <button
              type='button'
              onClick={() => setMode("signin")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 ${
                mode === "signin"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <LogIn className='w-4 h-4' />
              Se connecter
            </button>
            <button
              type='button'
              onClick={() => setMode("signup")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <UserPlus className='w-4 h-4' />
              S'inscrire
            </button>
          </div>

          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100'>
              {mode === "signin" ? "Bon retour" : "Commencez"}
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {mode === "signin"
                ? "Connectez-vous pour suivre vos rues favorites"
                : "Créez un compte pour sauvegarder vos rues favorites"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1.5'>
              <Input
                ref={emailInputRef}
                id='email'
                type='email'
                placeholder='Adresse e-mail'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onTouchStart={() => handleInputClick(emailInputRef)}
                required
                disabled={loading}
                autoComplete='email'
                className='h-11 text-base'
              />
            </div>

            <div className='space-y-1.5'>
              <Input
                ref={passwordInputRef}
                id='password'
                type='password'
                placeholder='Mot de passe'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onTouchStart={() => handleInputClick(passwordInputRef)}
                required
                disabled={loading}
                minLength={6}
                autoComplete='current-password'
                className='h-11 text-base'
              />
              {mode === "signup" && (
                <p className='text-xs text-gray-500 dark:text-gray-400 px-1'>
                  Minimum 6 caractères
                </p>
              )}
            </div>

            {error && (
              <div className='text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-1 duration-200'>
                {error}
              </div>
            )}

            <Button
              type='submit'
              className='w-full h-11 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md'
              style={{
                backgroundColor: mode === "signup" ? "#22c55e" : "#3b82f6",
              }}
              disabled={loading}
            >
              {loading ? (
                <span className='flex items-center justify-center gap-2'>
                  <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Veuillez patienter...
                </span>
              ) : mode === "signin" ? (
                "Se connecter"
              ) : (
                "Créer un compte"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

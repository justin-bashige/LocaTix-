import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Database, Copy, Check } from 'lucide-react';
import { SCHEMA_SQL } from '../../lib/schemaSql';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSchemaMissing =
    message.toLowerCase().includes("could not find the table 'public.houses'") ||
    message.toLowerCase().includes("relation \"public.houses\" does not exist") ||
    message.toLowerCase().includes("schema cache");

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-semibold text-rose-950">
              {isSchemaMissing
                ? "Tables en cours d'initialisation"
                : "Information"}
            </p>
            <p className="text-xs text-rose-800 mt-0.5 break-words">{message}</p>
          </div>

          {isSchemaMissing && (
            <div className="p-3 bg-white/90 border border-rose-200 rounded-lg text-xs text-slate-700 space-y-2">
              <p className="font-medium text-slate-900">
                Initialisation de la base de données
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Le serveur est connecté, mais les tables nécessaires n'ont pas encore été créées dans la base de données.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Script SQL copié !' : 'Copier le script SQL'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {showSql ? 'Masquer le code' : 'Afficher le code SQL'}
                </button>
              </div>

              {showSql && (
                <div className="mt-2 bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[10px] font-mono max-h-48 overflow-y-auto">
                  <pre>{SCHEMA_SQL}</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

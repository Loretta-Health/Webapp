import { AlertCircle, Home } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import lorettaLogoHorizontal from '@assets/logos/loretta_logo_horizontal.png';

export default function NotFound() {
  const { t } = useTranslation('pages');
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 safe-area-top safe-area-bottom">
      <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl shadow-[#013DC4]/10 w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <img src={lorettaLogoHorizontal} alt="Loretta" className="h-8 sm:h-10 mb-6 object-contain" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {t('notFound.title')}
          </h1>

          <p className="text-gray-500 font-medium mb-6">
            {t('notFound.message')}
          </p>
          
          <Link href="/my-dashboard">
            <button className="px-6 py-3 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 hover:opacity-90 transition-all flex items-center gap-2 min-h-[48px]">
              <Home className="w-5 h-5" />
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

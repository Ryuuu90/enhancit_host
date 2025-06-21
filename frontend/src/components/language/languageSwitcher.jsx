import React from 'react';
import { Globe } from 'lucide-react';
import './languageSwitcher.css';

const LanguageSwitcher = ({ language, setLanguage }) => {
  return (
    <div className="language-switcher">
      <div className="flex items-center gap-2 bg-black border border-white rounded-lg p-2">
        <Globe size={18} className="text-orange-500" />
        <div className="flex rounded overflow-hidden">
          <button
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              language === 'fr' 
                ? 'bg-orange-600 text-white' 
                : 'bg-black text-white border-2 hover:bg-orange-900 cursor-pointer'
            }`}
            onClick={() => setLanguage('fr')}
          >
            FR
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium border-2 transition-colors ${
              language === 'en' 
                ? 'bg-orange-600 text-white' 
                : 'bg-black text-white hover:bg-orange-900 cursor-pointer'
            }`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
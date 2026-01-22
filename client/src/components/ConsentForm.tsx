import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Watch, 
  UserX, 
  Ban,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import lorettaLogoHorizontal from '@assets/logos/loretta_logo_horizontal.png';

interface ConsentFormProps {
  onAccept: (newsletterOptIn: boolean) => void;
  onDecline: () => void;
}

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl
      ${glow ? 'shadow-[#013DC4]/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

const privacyPointsConfig = [
  { icon: Eye, key: 'control', gradient: 'from-[#013DC4] to-[#0150FF]' },
  { icon: Heart, key: 'insights', gradient: 'from-red-400 to-red-500' },
  { icon: FileText, key: 'documents', gradient: 'from-[#CDB6EF] to-purple-400' },
  { icon: Watch, key: 'integrations', gradient: 'from-amber-400 to-orange-400' },
  { icon: Lock, key: 'security', gradient: 'from-[#013DC4] to-[#0150FF]' },
  { icon: UserX, key: 'choice', gradient: 'from-green-400 to-emerald-500' },
  { icon: Ban, key: 'noSelling', gradient: 'from-red-400 to-red-500' },
];

export default function ConsentForm({ onAccept, onDecline }: ConsentFormProps) {
  const { t } = useTranslation('pages');
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'en' | 'de'>('en');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="overflow-hidden" glow>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] p-6 text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <img src={lorettaLogoHorizontal} alt="Loretta" className="h-10 sm:h-12 object-contain brightness-0 invert drop-shadow-lg" data-testid="logo-consent" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{t('consent.welcomeTitle')}</h1>
              <p className="text-white/80 text-sm font-medium">{t('consent.subtitle')}</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('consent.privacyTitle')}</h2>
                <p className="text-xs text-gray-500 font-medium">{t('consent.privacySubtitle')}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 font-medium bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 p-3 rounded-2xl border border-[#013DC4]/20">
              {t('consent.trustMessage')}
            </p>

            <div className="space-y-2">
              {privacyPointsConfig.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${point.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <point.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t(`consent.privacyPoints.${point.key}.title`)}</p>
                    <p className="text-xs text-gray-500 font-medium">{t(`consent.privacyPoints.${point.key}.description`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
              data-testid="disclaimer-notice"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('consent.disclaimer.title')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {t('consent.disclaimer.message')}
                </p>
              </div>
            </motion.div>

            <button
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all text-[#013DC4] font-semibold"
              onClick={() => setShowFullPolicy(!showFullPolicy)}
              data-testid="button-toggle-policy"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                {t('consent.readPolicy')}
              </span>
              {showFullPolicy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showFullPolicy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 text-xs text-gray-500 dark:text-gray-400" data-testid="policy-content">
                    <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-900/50 rounded-xl mb-4">
                      <button
                        onClick={() => setActiveTab('en')}
                        className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                          activeTab === 'en'
                            ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setActiveTab('de')}
                        className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                          activeTab === 'de'
                            ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
                        }`}
                      >
                        Deutsch
                      </button>
                    </div>
                    
                    {activeTab === 'en' ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                          <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — PRIVACY POLICY</h3>
                          <p className="text-[10px] mt-1">Last Updated: January 21, 2026 | Effective Date: January 21, 2026</p>
                        </div>
                        
                        <div className="space-y-2 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-xl">
                          <h4 className="font-bold text-gray-900 dark:text-white">Privacy at a Glance</h4>
                          <ul className="space-y-1">
                            <li><strong className="text-gray-900 dark:text-white">We never sell your data.</strong> Your health information belongs to you.</li>
                            <li><strong className="text-gray-900 dark:text-white">You're in control.</strong> Access, update, or delete your data at support@loretta.care.</li>
                            <li><strong className="text-gray-900 dark:text-white">Anonymization first.</strong> Your name is anonymized in our database.</li>
                            <li><strong className="text-gray-900 dark:text-white">European data protection.</strong> We're based in Berlin and fully comply with GDPR.</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">1. Data Controller</h4>
                          <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Germany<br/>Email: support@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">2. What Data We Collect</h4>
                          <p><strong className="text-gray-900 dark:text-white">Health Data:</strong> Medication information, health risk scores, emotional check-ins, wellbeing data.</p>
                          <p><strong className="text-gray-900 dark:text-white">Personal Information:</strong> Name (anonymized), email address, phone number.</p>
                          <p><strong className="text-gray-900 dark:text-white">Usage Data:</strong> App interactions, features accessed, performance data.</p>
                          <p><strong className="text-gray-900 dark:text-white">Analytics:</strong> Device information, usage patterns via Microsoft Clarity.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">3. How We Use Your Data</h4>
                          <p><strong className="text-gray-900 dark:text-white">Health Services:</strong> Personalized recommendations, health insights, medication tracking, risk score monitoring.</p>
                          <p><strong className="text-gray-900 dark:text-white">Research:</strong> Advancing chronic disease prevention through health AI research, improving early detection strategies.</p>
                          <p><strong className="text-gray-900 dark:text-white">App Improvement:</strong> Analyzing usage patterns, monitoring performance.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">4. Legal Basis (GDPR)</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Consent (Art. 6(1)(a), Art. 9(2)(a)) for health data</li>
                            <li>Legitimate Interest (Art. 6(1)(f)) for analytics</li>
                            <li>Contract Performance (Art. 6(1)(b)) for services</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">5. Your Rights</h4>
                          <p>Access, rectification, erasure, restriction, data portability, objection, and withdrawal of consent. Contact support@loretta.care to exercise your rights.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">6. Data Sharing</h4>
                          <p><strong className="text-gray-900 dark:text-white">We do not sell your personal data.</strong> We may share with service providers (Microsoft Clarity), when required by law, or anonymized data for research.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">7. Contact & Complaints</h4>
                          <p>Questions: support@loretta.care<br/>Complaints: Berlin Commissioner for Data Protection, Friedrichstr. 219, 10969 Berlin</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                          <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — DATENSCHUTZERKLÄRUNG</h3>
                          <p className="text-[10px] mt-1">Letzte Aktualisierung: 21. Januar 2026 | Gültig ab: 21. Januar 2026</p>
                        </div>
                        
                        <div className="space-y-2 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-xl">
                          <h4 className="font-bold text-gray-900 dark:text-white">Datenschutz auf einen Blick</h4>
                          <ul className="space-y-1">
                            <li><strong className="text-gray-900 dark:text-white">Wir verkaufen niemals Ihre Daten.</strong> Ihre Gesundheitsdaten gehören Ihnen.</li>
                            <li><strong className="text-gray-900 dark:text-white">Sie haben die Kontrolle.</strong> Zugriff, Aktualisierung oder Löschung unter support@loretta.care.</li>
                            <li><strong className="text-gray-900 dark:text-white">Anonymisierung zuerst.</strong> Ihr Name wird in unserer Datenbank anonymisiert.</li>
                            <li><strong className="text-gray-900 dark:text-white">Europäischer Datenschutz.</strong> Wir sind in Berlin ansässig und DSGVO-konform.</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">1. Verantwortlicher</h4>
                          <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Deutschland<br/>E-Mail: support@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">2. Welche Daten wir erheben</h4>
                          <p><strong className="text-gray-900 dark:text-white">Gesundheitsdaten:</strong> Medikamenteninformationen, Gesundheitsrisikobewertungen, emotionale Check-ins, Wohlbefindensdaten.</p>
                          <p><strong className="text-gray-900 dark:text-white">Persönliche Daten:</strong> Name (anonymisiert), E-Mail-Adresse, Telefonnummer.</p>
                          <p><strong className="text-gray-900 dark:text-white">Nutzungsdaten:</strong> App-Interaktionen, genutzte Funktionen, Leistungsdaten.</p>
                          <p><strong className="text-gray-900 dark:text-white">Analytik:</strong> Geräteinformationen, Nutzungsmuster über Microsoft Clarity.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">3. Wie wir Ihre Daten verwenden</h4>
                          <p><strong className="text-gray-900 dark:text-white">Gesundheitsdienste:</strong> Personalisierte Empfehlungen, Gesundheitseinblicke, Medikamentenverfolgung, Risikobewertung.</p>
                          <p><strong className="text-gray-900 dark:text-white">Forschung:</strong> Förderung der Prävention chronischer Krankheiten durch KI-Gesundheitsforschung.</p>
                          <p><strong className="text-gray-900 dark:text-white">App-Verbesserung:</strong> Analyse von Nutzungsmustern, Leistungsüberwachung.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">4. Rechtsgrundlage (DSGVO)</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Einwilligung (Art. 6(1)(a), Art. 9(2)(a)) für Gesundheitsdaten</li>
                            <li>Berechtigtes Interesse (Art. 6(1)(f)) für Analytik</li>
                            <li>Vertragserfüllung (Art. 6(1)(b)) für Dienste</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">5. Ihre Rechte</h4>
                          <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf der Einwilligung. Kontakt: support@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">6. Datenweitergabe</h4>
                          <p><strong className="text-gray-900 dark:text-white">Wir verkaufen Ihre Daten nicht.</strong> Weitergabe an Dienstleister (Microsoft Clarity), bei rechtlicher Verpflichtung oder anonymisierte Daten für Forschung.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">7. Kontakt & Beschwerden</h4>
                          <p>Fragen: support@loretta.care<br/>Beschwerden: Berliner Beauftragte für Datenschutz, Friedrichstr. 219, 10969 Berlin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all text-[#013DC4] font-semibold"
              onClick={() => setShowAccessibility(!showAccessibility)}
              data-testid="button-toggle-accessibility"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                {t('consent.accessibilityButton')}
              </span>
              {showAccessibility ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showAccessibility && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 text-xs text-gray-500 dark:text-gray-400 space-y-4" data-testid="accessibility-content">
                    <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                      <h3 className="font-black text-gray-900 dark:text-white text-sm">{t('consent.accessibility.title')}</h3>
                    </div>
                    
                    <p>{t('consent.accessibility.intro')}</p>
                    <p>{t('consent.accessibility.designIntro')}</p>
                    
                    <ul className="list-disc list-inside space-y-2">
                      <li>{t('consent.accessibility.points.language')}</li>
                      <li>{t('consent.accessibility.points.navigation')}</li>
                      <li>{t('consent.accessibility.points.colors')}</li>
                      <li>{t('consent.accessibility.points.screenReader')}</li>
                      <li>{t('consent.accessibility.points.identity')}</li>
                      <li>{t('consent.accessibility.points.support')}</li>
                    </ul>
                    
                    <p>{t('consent.accessibility.contact')} <a href="mailto:info@loretta.care" className="text-[#013DC4] font-semibold hover:underline">info@loretta.care</a>.</p>
                    
                    <p className="font-semibold text-gray-900 dark:text-white">{t('consent.accessibility.feedbackNote')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border border-[#013DC4]/20">
              <Checkbox 
                id="acknowledge" 
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                data-testid="checkbox-acknowledge"
                className="mt-0.5"
              />
              <label htmlFor="acknowledge" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer leading-relaxed font-medium">
                {t('consent.acknowledge')}
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10">
              <Checkbox 
                id="newsletter" 
                checked={newsletterOptIn}
                onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
                data-testid="checkbox-newsletter"
                className="mt-0.5"
              />
              <label htmlFor="newsletter" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer leading-relaxed flex items-start gap-2 font-medium">
                <Mail className="w-4 h-4 text-[#013DC4] flex-shrink-0 mt-0.5" />
                <span>{t('consent.newsletterOptIn')}</span>
              </label>
            </div>

            <div className="space-y-3">
              <button
                className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[56px]"
                onClick={() => onAccept(newsletterOptIn)}
                disabled={!acknowledged}
                data-testid="button-accept-consent"
              >
                <Shield className="w-5 h-5" />
                {t('consent.acceptContinue')}
              </button>
              <button
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={onDecline}
                data-testid="button-decline-consent"
              >
                {t('consent.decline')}
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

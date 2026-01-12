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
                          <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — GDPR CONSENT & PRIVACY POLICY (EN)</h3>
                          <p className="text-[10px] mt-1">Last Updated: November 25, 2025 | Effective Date: November 25, 2025</p>
                        </div>
                        
                        <p>This Privacy and Consent Policy explains how Loretta Health UG (haftungsbeschränkt) ("Loretta", "we", "us") processes your personal and health data when you use the Loretta mobile application. Loretta provides wellbeing insights, behavioural support, and analysis of medical information. We do not provide diagnosis or medical treatment.</p>
                        
                        <p><strong className="text-gray-900 dark:text-white">You choose what you share and may withdraw consent at any time.</strong></p>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">1. Controller</h4>
                          <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Germany<br/>Email: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">2. Categories of Data Processed</h4>
                          <p><strong className="text-gray-900 dark:text-white">2.1 Account Data</strong><br/>Name, email, password (encrypted), age, gender identity, language, profile settings.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.2 Health and Wellbeing Data</strong><br/>Self reported symptoms, stress indicators, lifestyle information, and optional identity attributes (ethnicity, sexuality, disability). These fields are always voluntary.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.3 Wearable Data</strong><br/>With your consent, we may process data from Apple Health or Google Fit including: steps, activity, sleep, heart rate, HRV, blood oxygen, ECG (if available), cycle data, and other metrics supported by your device. You may disconnect wearables at any time.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.4 Uploaded Medical Documents</strong><br/>Medical documents are used to generate explanations and are deleted immediately after processing.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.5 Coarse Location</strong><br/>We process only approximate regional location to identify environmental and wellbeing factors. We do not collect precise GPS location.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.6 Technical and Device Data</strong><br/>Operating system, device type, crash logs, app usage logs, IP address (anonymised), and permission settings.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">3. Purposes of Processing</h4>
                          <p><strong className="text-gray-900 dark:text-white">3.1 Service Delivery</strong><br/>To provide personalised insights, document explanations, behaviour support, and health-equity–aware features.</p>
                          <p><strong className="text-gray-900 dark:text-white">3.2 Fairness and Safety</strong><br/>To ensure equitable model performance, reduce bias, and maintain accuracy across demographic groups. Only authorised data scientists and engineers may access limited datasets where necessary.</p>
                          <p><strong className="text-gray-900 dark:text-white">3.3 Research and Development</strong><br/>Pseudonymised data may be used for statistical analysis and model improvement. You may opt out at any time.</p>
                          <p><strong className="text-gray-900 dark:text-white">3.4 Security and Compliance</strong><br/>To monitor system integrity, detect misuse, ensure secure operation, and fulfil regulatory requirements.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">4. Legal Bases</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Explicit consent (Art. 6(1)(a), Art. 9(2)(a))</li>
                            <li>Performance of a contract (Art. 6(1)(b))</li>
                            <li>Legitimate interests for security and product improvement (Art. 6(1)(f))</li>
                            <li>Research/statistics under safeguards (Art. 9(2)(j))</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">5. Special Category and Identity Data</h4>
                          <p>Optional identity attributes are used only to improve fairness, accuracy, and representation. They are not used for advertising, exclusion, or automated decision-making with legal effect.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">6. Sharing of Data</h4>
                          <p>Data may be shared with:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Staleaway (EU-based hosting provider)</li>
                            <li>Google Workspace (email services)</li>
                            <li>Pseudonymised research environments (EU-based)</li>
                            <li>Individuals you choose to share data with</li>
                          </ul>
                          <p className="font-bold text-gray-900 dark:text-white mt-2">We do not sell your data.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">7-14. Additional Sections</h4>
                          <p>International Transfers, Retention, Security Measures, Access Restrictions, Automated Decision-Making, User Rights, Children, and Updates are detailed in the full policy available at privacy@loretta.care</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
                          <h3 className="font-black text-gray-900 dark:text-white text-sm">LORETTA HEALTH UG — DATENSCHUTZ- UND EINWILLIGUNGSERKLÄRUNG (DE)</h3>
                          <p className="text-[10px] mt-1">Letzte Aktualisierung: November 25, 2025 | Gültig ab: November 25, 2025</p>
                        </div>
                        
                        <p>Diese Erklärung beschreibt, wie die Loretta Health UG (haftungsbeschränkt) („Loretta", „wir") personenbezogene und gesundheitsbezogene Daten verarbeitet. Loretta bietet personalisierte Einblicke, Wohlbefindensunterstützung und Erklärungen zu medizinischen Informationen. Wir stellen keine Diagnosen und führen keine medizinischen Behandlungen durch.</p>
                        
                        <p><strong className="text-gray-900 dark:text-white">Sie entscheiden, welche Daten Sie teilen, und können Ihre Einwilligung jederzeit widerrufen.</strong></p>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">1. Verantwortlicher</h4>
                          <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Deutschland<br/>E-Mail: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">2. Verarbeitete Datenkategorien</h4>
                          <p><strong className="text-gray-900 dark:text-white">2.1 Kontodaten</strong><br/>Name, E-Mail, Passwort (verschlüsselt), Alter, Geschlechtsidentität, Spracheinstellungen, Profileinstellungen.</p>
                          <p><strong className="text-gray-900 dark:text-white">2.2 Gesundheits- und Wellnessdaten</strong><br/>Selbst eingegebene Beschwerden, Stressindikatoren, Lebensstilinformatonen sowie freiwillige Identitätsmerkmale.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">3-14. Weitere Abschnitte</h4>
                          <p>Zwecke der Verarbeitung, Rechtsgrundlagen, Weitergabe, Aufbewahrung, Sicherheit, Nutzerrechte und weitere Details finden Sie in der vollständigen Richtlinie unter privacy@loretta.care</p>
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

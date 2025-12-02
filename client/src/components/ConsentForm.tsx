import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Watch, 
  Database, 
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
import lorettaLogo from '@assets/logos/loretta_logo.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface ConsentFormProps {
  onAccept: (newsletterOptIn: boolean) => void;
  onDecline: () => void;
}

const privacyPoints = [
  {
    icon: Eye,
    title: "You control what you share",
    description: "All identity fields are optional.",
    color: "text-primary"
  },
  {
    icon: Heart,
    title: "Personalised insights",
    description: "We use your data to provide personalised insights and support health equity.",
    color: "text-destructive"
  },
  {
    icon: FileText,
    title: "Document privacy",
    description: "Medical documents are deleted immediately after processing.",
    color: "text-chart-2"
  },
  {
    icon: Watch,
    title: "Optional integrations",
    description: "Wearable and location data are only used if you choose to enable them.",
    color: "text-chart-3"
  },
  {
    icon: Lock,
    title: "Data security",
    description: "We take appropriate measures to protect your data.",
    color: "text-primary"
  },
  {
    icon: UserX,
    title: "Your choice",
    description: "You may opt out of research and withdraw consent at any time.",
    color: "text-chart-1"
  },
  {
    icon: Ban,
    title: "No data selling",
    description: "We never sell your data.",
    color: "text-destructive"
  }
];

export default function ConsentForm({ onAccept, onDecline }: ConsentFormProps) {
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 text-center">
            <div className="flex justify-center mb-4">
              <img src={lorettaLogo} alt="Loretta" className="h-12 object-contain" data-testid="logo-consent" />
            </div>
            <div className="flex justify-center mb-3">
              <motion.img 
                src={mascotImage} 
                alt="Loretta Mascot" 
                className="w-16 h-16 object-contain drop-shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Welcome to Loretta</h1>
            <p className="text-primary-foreground/80 text-sm">Your health companion</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Privacy Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Privacy & Consent</h2>
                <p className="text-xs text-muted-foreground">Before you begin, please review our privacy practices.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg border border-primary/10">
              Your trust and privacy are our top priorities.
            </p>

            {/* Privacy Points */}
            <div className="space-y-3">
              {privacyPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover-elevate"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-${point.color.replace('text-', '')}/20 to-${point.color.replace('text-', '')}/10 flex items-center justify-center flex-shrink-0`}>
                    <point.icon className={`w-4 h-4 ${point.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{point.title}</p>
                    <p className="text-xs text-muted-foreground">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Important Disclaimer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-chart-3/10 border border-chart-3/30"
              data-testid="disclaimer-notice"
            >
              <div className="w-8 h-8 rounded-full bg-chart-3/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-chart-3" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Important Disclaimer</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Loretta is not a diagnostic tool. The information provided is for educational purposes only 
                  and should not replace professional medical advice, diagnosis, or treatment. 
                  Always consult your healthcare provider.
                </p>
              </div>
            </motion.div>

            {/* Full Privacy Policy Toggle */}
            <Button
              variant="ghost"
              className="w-full justify-between text-primary"
              onClick={() => setShowFullPolicy(!showFullPolicy)}
              data-testid="button-toggle-policy"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Read Full Privacy Policy
              </span>
              {showFullPolicy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            <AnimatePresence>
              {showFullPolicy && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground" data-testid="policy-content">
                    <Tabs defaultValue="en" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="en">English</TabsTrigger>
                        <TabsTrigger value="de">Deutsch</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="en" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <div className="text-center border-b border-border pb-3">
                          <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — GDPR CONSENT & PRIVACY POLICY (EN)</h3>
                          <p className="text-[10px] mt-1">Last Updated: November 25, 2025 | Effective Date: November 25, 2025</p>
                        </div>
                        
                        <p>This Privacy and Consent Policy explains how Loretta Health UG (haftungsbeschränkt) ("Loretta", "we", "us") processes your personal and health data when you use the Loretta mobile application. Loretta provides wellbeing insights, behavioural support, and analysis of medical information. We do not provide diagnosis or medical treatment.</p>
                        
                        <p><strong>You choose what you share and may withdraw consent at any time.</strong></p>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">1. Controller</h4>
                          <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Germany<br/>Email: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">2. Categories of Data Processed</h4>
                          <p><strong>2.1 Account Data</strong><br/>Name, email, password (encrypted), age, gender identity, language, profile settings.</p>
                          <p><strong>2.2 Health and Wellbeing Data</strong><br/>Self reported symptoms, stress indicators, lifestyle information, and optional identity attributes (ethnicity, sexuality, disability). These fields are always voluntary.</p>
                          <p><strong>2.3 Wearable Data</strong><br/>With your consent, we may process data from Apple Health or Google Fit including: steps, activity, sleep, heart rate, HRV, blood oxygen, ECG (if available), cycle data, and other metrics supported by your device. You may disconnect wearables at any time.</p>
                          <p><strong>2.4 Uploaded Medical Documents</strong><br/>Medical documents are used to generate explanations and are deleted immediately after processing.</p>
                          <p><strong>2.5 Coarse Location</strong><br/>We process only approximate regional location to identify environmental and wellbeing factors. We do not collect precise GPS location.</p>
                          <p><strong>2.6 Technical and Device Data</strong><br/>Operating system, device type, crash logs, app usage logs, IP address (anonymised), and permission settings.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">3. Purposes of Processing</h4>
                          <p><strong>3.1 Service Delivery</strong><br/>To provide personalised insights, document explanations, behaviour support, and health-equity–aware features.</p>
                          <p><strong>3.2 Fairness and Safety</strong><br/>To ensure equitable model performance, reduce bias, and maintain accuracy across demographic groups. Only authorised data scientists and engineers may access limited datasets where necessary.</p>
                          <p><strong>3.3 Research and Development</strong><br/>Pseudonymised data may be used for statistical analysis and model improvement. You may opt out at any time.</p>
                          <p><strong>3.4 Security and Compliance</strong><br/>To monitor system integrity, detect misuse, ensure secure operation, and fulfil regulatory requirements.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">4. Legal Bases</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Explicit consent (Art. 6(1)(a), Art. 9(2)(a))</li>
                            <li>Performance of a contract (Art. 6(1)(b))</li>
                            <li>Legitimate interests for security and product improvement (Art. 6(1)(f))</li>
                            <li>Research/statistics under safeguards (Art. 9(2)(j))</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">5. Special Category and Identity Data</h4>
                          <p>Optional identity attributes are used only to improve fairness, accuracy, and representation. They are not used for advertising, exclusion, or automated decision-making with legal effect.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">6. Sharing of Data</h4>
                          <p>Data may be shared with:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Staleaway (EU-based hosting provider)</li>
                            <li>Google Workspace (email services)</li>
                            <li>Pseudonymised research environments (EU-based)</li>
                            <li>Individuals you choose to share data with</li>
                          </ul>
                          <p className="font-bold mt-2">We do not sell your data.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">7. International Transfers</h4>
                          <p>Data is hosted in the EU. If transfers occur, we apply SCCs and supplementary safeguards.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">8. Retention</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Account data: until deleted by the user</li>
                            <li>Wearable and behavioural data: only as long as necessary</li>
                            <li>Medical uploads: deleted immediately</li>
                            <li>Research data: pseudonymised and retained under governance rules</li>
                            <li>Logs: retained for security and stability</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">9. Security Measures</h4>
                          <p>Encryption, pseudonymisation, RBAC, monitoring, secure development environments, auditing, EU-based infrastructure.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">10. Access Restrictions</h4>
                          <p>Only authorised data scientists and engineers may access certain data when required for maintenance or fairness monitoring.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">11. Automated Decision-Making</h4>
                          <p>Loretta does not engage in automated decision-making producing legal or significant effects.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">12. User Rights</h4>
                          <p>You have the right to access, correct, delete, restrict, object, withdraw consent, and request portability. Contact: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">13. Children</h4>
                          <p>The service is not intended for users under 16.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">14. Updates</h4>
                          <p>We may update this Policy. Significant changes will be communicated.</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="de" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <div className="text-center border-b border-border pb-3">
                          <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — DATENSCHUTZ- UND EINWILLIGUNGSERKLÄRUNG (DE)</h3>
                          <p className="text-[10px] mt-1">Letzte Aktualisierung: November 25, 2025 | Gültig ab: November 25, 2025</p>
                        </div>
                        
                        <p>Diese Erklärung beschreibt, wie die Loretta Health UG (haftungsbeschränkt) („Loretta", „wir") personenbezogene und gesundheitsbezogene Daten verarbeitet. Loretta bietet personalisierte Einblicke, Wohlbefindensunterstützung und Erklärungen zu medizinischen Informationen. Wir stellen keine Diagnosen und führen keine medizinischen Behandlungen durch.</p>
                        
                        <p><strong>Sie entscheiden, welche Daten Sie teilen, und können Ihre Einwilligung jederzeit widerrufen.</strong></p>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">1. Verantwortlicher</h4>
                          <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Deutschland<br/>E-Mail: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">2. Verarbeitete Datenkategorien</h4>
                          <p><strong>2.1 Kontodaten</strong><br/>Name, E-Mail, Passwort (verschlüsselt), Alter, Geschlechtsidentität, Spracheinstellungen, Profileinstellungen.</p>
                          <p><strong>2.2 Gesundheits- und Wellnessdaten</strong><br/>Selbst eingegebene Beschwerden, Stressindikatoren, Lebensstilinformatonen sowie freiwillige Identitätsmerkmale (ethnische Zugehörigkeit, sexuelle Orientierung, Behinderung).</p>
                          <p><strong>2.3 Wearable-Daten</strong><br/>Mit Ihrer Einwilligung verarbeiten wir Daten aus Apple Health oder Google Fit: Schritte, Aktivität, Schlaf, Herzfrequenz, HRV, Blutsauerstoff, EKG (falls verfügbar), Zyklusdaten und weitere Gerätemesswerte.</p>
                          <p><strong>2.4 Hochgeladene medizinische Dokumente</strong><br/>Dokumente werden analysiert und anschließend sofort gelöscht.</p>
                          <p><strong>2.5 Grober Standort</strong><br/>Wir verarbeiten nur ungefähre Region für kontextbezogene Hinweise. Keine genaue GPS-Erfassung.</p>
                          <p><strong>2.6 Technische Daten</strong><br/>Geräteinformationen, Absturzberichte, Logdaten, anonymisierte IP-Adresse und Berechtigungseinstellungen.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">3. Zwecke der Verarbeitung</h4>
                          <p><strong>3.1 Bereitstellung des Dienstes</strong><br/>Personalisierte Einblicke, Dokumentenerklärungen, Verhaltensunterstützung, chancengerechte Gesundheitsfunktionen.</p>
                          <p><strong>3.2 Fairness und Sicherheit</strong><br/>Sicherstellung gerechter Modellergebnisse, Vermeidung von Bias. Zugriff nur durch autorisierte Data Scientists und Entwickler.</p>
                          <p><strong>3.3 Forschung und Weiterentwicklung</strong><br/>Pseudonymisierte Daten für statistische Analyse und Modellverbesserung. Nutzer können widersprechen.</p>
                          <p><strong>3.4 Sicherheit und Compliance</strong><br/>Systemintegrität, Missbrauchsvermeidung, sicherer Betrieb, regulatorische Anforderungen.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">4. Rechtsgrundlagen</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Ausdrückliche Einwilligung</li>
                            <li>Vertragserfüllung</li>
                            <li>Berechtigtes Interesse für Sicherheit und Verbesserung</li>
                            <li>Forschung/Statistik mit Schutzmaßnahmen</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">5. Besondere Kategorien und Identitätsdaten</h4>
                          <p>Optionale Identitätsmerkmale werden ausschließlich zur Fairnessverbesserung verwendet und niemals für Werbung, Ausschluss oder rechtlich relevante Entscheidungen genutzt.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">6. Weitergabe</h4>
                          <p>Datenweitergabe erfolgt nur an:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Staleaway (EU-Hosting)</li>
                            <li>Google Workspace (E-Mail)</li>
                            <li>Forschungspartner mit pseudonymisierten Daten</li>
                            <li>Personen, mit denen Sie selbst teilen</li>
                          </ul>
                          <p className="font-bold mt-2">Kein Datenverkauf.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">7. Internationale Übermittlungen</h4>
                          <p>Daten werden in der EU gespeichert; falls abweichend, werden Standardvertragsklauseln genutzt.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">8. Aufbewahrung</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Kontodaten: bis zur Löschung</li>
                            <li>Wearable- und Verhaltensdaten: nur solange erforderlich</li>
                            <li>Dokumente: sofort gelöscht</li>
                            <li>Forschungsdaten: pseudonymisiert nach Vorgaben</li>
                            <li>Logs: zur Sicherheit begrenzt aufbewahrt</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">9. Sicherheit</h4>
                          <p>Verschlüsselung, Pseudonymisierung, rollenbasierte Zugriffe, Überwachung, sichere Entwicklungsumgebungen, EU-Hosting.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">10. Zugriffsbeschränkungen</h4>
                          <p>Nur autorisierte Data Scientists und Entwickler bei Bedarf.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">11. Automatisierte Entscheidungen</h4>
                          <p>Keine automatisierten Entscheidungen mit rechtlicher Wirkung.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">12. Nutzerrechte</h4>
                          <p>Zugriff, Berichtigung, Löschung, Einschränkung, Widerspruch, Widerruf und Übertragbarkeit. Kontakt: privacy@loretta.care</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">13. Kinder</h4>
                          <p>Nicht für Nutzer unter 16 Jahren bestimmt.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-foreground">14. Änderungen</h4>
                          <p>Änderungen werden mitgeteilt.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inclusion & Accessibility Statement Toggle */}
            <Button
              variant="ghost"
              className="w-full justify-between text-primary"
              onClick={() => setShowAccessibility(!showAccessibility)}
              data-testid="button-toggle-accessibility"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Read Inclusion & Accessibility Statement
              </span>
              {showAccessibility ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            <AnimatePresence>
              {showAccessibility && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-4" data-testid="accessibility-content">
                    <div className="text-center border-b border-border pb-3">
                      <h3 className="font-black text-foreground text-sm">Inclusion & Accessibility at Loretta</h3>
                    </div>
                    
                    <p>At Loretta, we believe everyone deserves easy, respectful, and reliable access to health and wellbeing support. Our app is built to serve people with different backgrounds, abilities, and levels of health literacy.</p>
                    
                    <p>To make this possible, we design our experience with inclusion and accessibility at the center:</p>
                    
                    <ul className="list-disc list-inside space-y-2">
                      <li>Clear, simple language is used throughout the app so information is easy to understand.</li>
                      <li>Flexible navigation supports different levels of digital experience.</li>
                      <li>Accessible color contrast and intuitive layouts are used throughout the app.</li>
                      <li>Screen-reader compatibility is currently in development, and we are working toward full accessibility support.</li>
                      <li>Respect for your identity is core to our work. You can always choose how you describe yourself.</li>
                      <li>Support is available if something is unclear or difficult to use.</li>
                    </ul>
                    
                    <p>If you encounter a barrier or need additional support, please contact us at <a href="mailto:info@loretta.care" className="text-primary font-semibold hover:underline">info@loretta.care</a>.</p>
                    
                    <p className="font-semibold text-foreground">Your feedback directly helps us improve accessibility for everyone.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Acknowledgment Checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
              <Checkbox 
                id="acknowledge" 
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                data-testid="checkbox-acknowledge"
              />
              <label htmlFor="acknowledge" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                By accepting, you acknowledge that you have read and understood our privacy practices.
              </label>
            </div>

            {/* Newsletter Opt-in Checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Checkbox 
                id="newsletter" 
                checked={newsletterOptIn}
                onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
                data-testid="checkbox-newsletter"
              />
              <label htmlFor="newsletter" className="text-xs text-muted-foreground cursor-pointer leading-relaxed flex items-start gap-2">
                <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>I would like to receive the Loretta newsletter with health tips, product updates, and special offers. You can unsubscribe at any time.</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white font-bold py-6"
                onClick={() => onAccept(newsletterOptIn)}
                disabled={!acknowledged}
                data-testid="button-accept-consent"
              >
                <Shield className="w-4 h-4 mr-2" />
                Accept & Continue
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onDecline}
                data-testid="button-decline-consent"
              >
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

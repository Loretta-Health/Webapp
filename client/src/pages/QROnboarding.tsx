import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, 
  Camera, 
  CameraOff,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Shield,
  Heart,
  AlertCircle,
  CheckCircle2,
  Keyboard,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Html5Qrcode } from 'html5-qrcode';
import lorettaLogo from '@assets/logos/loretta_logo.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface InviteData {
  inviterName: string;
  organization?: string;
  cohort?: string;
  timestamp: string;
  code?: string;
}

export default function QROnboarding() {
  const [, navigate] = useLocation();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<InviteData | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    
    if (codeFromUrl) {
      processInviteCode(codeFromUrl);
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    setCameraError(null);
    setScanning(true);
    
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          html5QrCode.stop().catch(() => {});
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or enter code manually.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    setScanning(false);
    processInviteCode(decodedText);
  };

  const processInviteCode = (codeOrUrl: string) => {
    setValidating(true);
    
    setTimeout(() => {
      let inviteCode = codeOrUrl;
      
      if (codeOrUrl.includes('/join?code=') || codeOrUrl.includes('?code=')) {
        try {
          const url = new URL(codeOrUrl);
          inviteCode = url.searchParams.get('code') || codeOrUrl;
        } catch {
          const match = codeOrUrl.match(/code=([^&]+)/);
          if (match) inviteCode = match[1];
        }
      }
      
      const inviteData: InviteData = {
        inviterName: 'A Loretta Member',
        organization: 'Loretta Health Community',
        cohort: 'November 2025',
        timestamp: new Date().toISOString(),
        code: inviteCode,
      };
      
      setScannedData(inviteData);
      localStorage.setItem('loretta_invite', JSON.stringify({
        inviterName: inviteData.inviterName,
        organization: inviteData.organization,
        code: inviteData.code,
      }));
      setValidating(false);
    }, 800);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processInviteCode(manualCode.trim());
    }
  };

  const proceedToOnboarding = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col">
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <img src={lorettaLogo} alt="Loretta" className="h-8" />
          <h1 className="text-xl font-black text-white">Join Loretta</h1>
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col">
        <AnimatePresence mode="wait">
          {!scannedData ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2">Scan to Join</h2>
                <p className="text-muted-foreground">
                  Scan the QR code from your invite to get started
                </p>
              </div>
              
              <Card className="flex-1 p-4 border-2 border-dashed border-primary/30 bg-gradient-to-br from-card to-primary/5 mb-4">
                {scanning ? (
                  <div className="relative">
                    <div id={scannerContainerId} className="w-full rounded-lg overflow-hidden" />
                    <Button
                      variant="secondary"
                      className="absolute bottom-4 left-1/2 -translate-x-1/2"
                      onClick={stopScanning}
                      data-testid="button-stop-scanning"
                    >
                      <CameraOff className="w-4 h-4 mr-2" />
                      Stop Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center">
                    {cameraError ? (
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
                        <Button onClick={startScanning} data-testid="button-retry-camera">
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4 text-center">
                          Point your camera at the QR code
                        </p>
                        <Button 
                          onClick={startScanning}
                          className="bg-gradient-to-r from-primary to-chart-2 font-bold"
                          data-testid="button-start-scanning"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Start Scanning
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </Card>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                {showManualEntry ? (
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <Input
                      placeholder="Enter invite code (e.g., LORETTA-XXXX)"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="text-center font-mono"
                      data-testid="input-invite-code"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowManualEntry(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-primary to-chart-2"
                        disabled={!manualCode.trim() || validating}
                        data-testid="button-submit-code"
                      >
                        {validating ? 'Validating...' : 'Submit Code'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowManualEntry(true)}
                    data-testid="button-manual-entry"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Enter Code Manually
                  </Button>
                )}
                
                <Link href="/onboarding">
                  <Button variant="ghost" className="w-full text-muted-foreground" data-testid="button-skip-invite">
                    Continue without invite code
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-black text-foreground mb-2">Welcome!</h2>
                <p className="text-muted-foreground">
                  You've been invited to join Loretta
                </p>
              </div>
              
              <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-primary/20 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <img src={mascotImage} alt="Mascot" className="w-16 h-16 object-contain" />
                  <div>
                    <p className="font-bold text-foreground">Invited by</p>
                    <p className="text-lg font-black text-primary" data-testid="inviter-name">
                      {scannedData.inviterName}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {scannedData.organization && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-chart-2" />
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-bold text-foreground">{scannedData.organization}</span>
                    </div>
                  )}
                  {scannedData.cohort && (
                    <div className="flex items-center gap-3 text-sm">
                      <Sparkles className="w-4 h-4 text-chart-3" />
                      <span className="text-muted-foreground">Cohort:</span>
                      <Badge variant="secondary">{scannedData.cohort}</Badge>
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-0 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-chart-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground text-sm">Your Privacy Matters</p>
                    <p className="text-xs text-muted-foreground">
                      You'll review our privacy policy before creating your account. All data sharing is optional.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Button
                variant="ghost"
                className="w-full justify-between text-primary mb-2"
                onClick={() => setShowFullPolicy(!showFullPolicy)}
                data-testid="button-toggle-policy-qr"
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
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground" data-testid="policy-content-qr">
                      <Tabs defaultValue="en" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="en">English</TabsTrigger>
                          <TabsTrigger value="de">Deutsch</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="en" className="space-y-4 max-h-64 overflow-y-auto pr-2">
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
                        
                        <TabsContent value="de" className="space-y-4 max-h-64 overflow-y-auto pr-2">
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
              
              <div className="space-y-3 mt-auto">
                <Button
                  onClick={proceedToOnboarding}
                  className="w-full bg-gradient-to-r from-primary to-chart-2 font-black text-lg py-6"
                  data-testid="button-continue-onboarding"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Continue to Setup
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you'll be guided through our privacy-first onboarding process
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

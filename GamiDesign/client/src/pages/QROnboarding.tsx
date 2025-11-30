import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Camera, 
  CameraOff,
  ChevronRight,
  Sparkles,
  Users,
  Shield,
  Heart,
  AlertCircle,
  CheckCircle2,
  Keyboard
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
              
              <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-0 mb-6">
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

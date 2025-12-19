import { Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { WeatherSimulationProvider } from "@/contexts/WeatherSimulationContext";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import Dashboard from "@/pages/Dashboard";
import MyDashboard from "@/pages/MyDashboard";
import Welcome from "@/pages/Welcome";
import Declined from "@/pages/Declined";
import Profile from "@/pages/Profile";
import Chat from "@/pages/Chat";
import Questionnaire from "@/pages/Questionnaire";
import MissionDetails from "@/pages/MissionDetails";
import Medications from "@/pages/Medications";
import MedicationDetails from "@/pages/MedicationDetails";
import StreakDetails from "@/pages/StreakDetails";
import ActivityDetails from "@/pages/ActivityDetails";
import QROnboarding from "@/pages/QROnboarding";
import Invite from "@/pages/Invite";
import Onboarding from "@/pages/Onboarding";
import LeaderboardPage from "@/pages/LeaderboardPage";
import Calendar from "@/pages/Calendar";
import RiskScoreDetails from "@/pages/RiskScoreDetails";
import AlternativeMissionDetails from "@/pages/AlternativeMissionDetails";
import AuthPage from "@/pages/auth-page";
import TeamInvite from "@/pages/TeamInvite";
import JoinFriend from "@/pages/JoinFriend";
import UIMockup from "@/pages/UIMockup";
import NotFound from "@/pages/not-found";

function ConsentGuard({ children }: { children: React.ReactNode }) {
  const { isConsentComplete, isLoading } = useOnboardingProgress();
  const { user } = useAuth();
  
  const { data: preferencesData, isLoading: prefsLoading } = useQuery<{ consentAccepted?: boolean } | null>({
    queryKey: ['/api/preferences'],
    enabled: !!user?.id,
  });
  
  const effectiveConsentComplete = isConsentComplete || preferencesData?.consentAccepted === true;
  
  if (isLoading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!effectiveConsentComplete) {
    return <Redirect to="/welcome" />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Redirect to="/my-dashboard" />;
  }
  
  return <Redirect to="/auth" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/my-dashboard" component={MyDashboard} />
      <ProtectedRoute path="/welcome" component={Welcome} />
      <ProtectedRoute path="/profile" component={() => (
        <ConsentGuard><Profile /></ConsentGuard>
      )} />
      <ProtectedRoute path="/chat" component={() => (
        <ConsentGuard><Chat /></ConsentGuard>
      )} />
      <ProtectedRoute path="/questionnaire" component={() => (
        <ConsentGuard><Questionnaire /></ConsentGuard>
      )} />
      <ProtectedRoute path="/mission-details" component={() => (
        <ConsentGuard><MissionDetails /></ConsentGuard>
      )} />
      <ProtectedRoute path="/alternative-mission" component={() => (
        <ConsentGuard><AlternativeMissionDetails /></ConsentGuard>
      )} />
      <ProtectedRoute path="/medications" component={() => (
        <ConsentGuard><Medications /></ConsentGuard>
      )} />
      <ProtectedRoute path="/medication-details" component={() => (
        <ConsentGuard><MedicationDetails /></ConsentGuard>
      )} />
      <ProtectedRoute path="/streak" component={() => (
        <ConsentGuard><StreakDetails /></ConsentGuard>
      )} />
      <ProtectedRoute path="/activity" component={() => (
        <ConsentGuard><ActivityDetails /></ConsentGuard>
      )} />
      <Route path="/join" component={QROnboarding} />
      <Route path="/join/:code" component={JoinFriend} />
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/invite" component={() => (
        <ConsentGuard><Invite /></ConsentGuard>
      )} />
      <ProtectedRoute path="/leaderboard" component={() => (
        <LeaderboardPage />
      )} />
      <ProtectedRoute path="/calendar" component={() => (
        <ConsentGuard><Calendar /></ConsentGuard>
      )} />
      <ProtectedRoute path="/risk-score" component={() => (
        <ConsentGuard><RiskScoreDetails /></ConsentGuard>
      )} />
      <Route path="/declined" component={Declined} />
      <Route path="/mockup" component={UIMockup} />
      <ProtectedRoute path="/team-invite" component={() => (
        <ConsentGuard><TeamInvite /></ConsentGuard>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WeatherSimulationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WeatherSimulationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;

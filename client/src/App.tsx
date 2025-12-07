import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/Dashboard";
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
import NotFound from "@/pages/not-found";

function ConsentGuard({ children }: { children: React.ReactNode }) {
  const consent = localStorage.getItem('loretta_consent');
  if (consent !== 'accepted') {
    return <Redirect to="/welcome" />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/dashboard" component={Dashboard} />
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
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/invite" component={() => (
        <ConsentGuard><Invite /></ConsentGuard>
      )} />
      <ProtectedRoute path="/leaderboard" component={() => (
        <ConsentGuard><LeaderboardPage /></ConsentGuard>
      )} />
      <ProtectedRoute path="/calendar" component={() => (
        <ConsentGuard><Calendar /></ConsentGuard>
      )} />
      <ProtectedRoute path="/risk-score" component={() => (
        <ConsentGuard><RiskScoreDetails /></ConsentGuard>
      )} />
      <Route path="/declined" component={Declined} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

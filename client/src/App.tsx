import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "@/pages/not-found";

function ConsentGuard({ children }: { children: React.ReactNode }) {
  const consent = localStorage.getItem('loretta_consent');
  if (consent !== 'accepted') {
    return <Redirect to="/" />;
  }
  return <>{children}</>;
}

function Router() {
  const consent = localStorage.getItem('loretta_consent');
  
  return (
    <Switch>
      <Route path="/">
        {consent === 'accepted' ? <Redirect to="/dashboard" /> : <Welcome />}
      </Route>
      <Route path="/dashboard">
        <ConsentGuard>
          <Dashboard />
        </ConsentGuard>
      </Route>
      <Route path="/profile">
        <ConsentGuard>
          <Profile />
        </ConsentGuard>
      </Route>
      <Route path="/chat">
        <ConsentGuard>
          <Chat />
        </ConsentGuard>
      </Route>
      <Route path="/questionnaire">
        <ConsentGuard>
          <Questionnaire />
        </ConsentGuard>
      </Route>
      <Route path="/mission-details">
        <ConsentGuard>
          <MissionDetails />
        </ConsentGuard>
      </Route>
      <Route path="/medications">
        <ConsentGuard>
          <Medications />
        </ConsentGuard>
      </Route>
      <Route path="/medication-details">
        <ConsentGuard>
          <MedicationDetails />
        </ConsentGuard>
      </Route>
      <Route path="/streak">
        <ConsentGuard>
          <StreakDetails />
        </ConsentGuard>
      </Route>
      <Route path="/activity">
        <ConsentGuard>
          <ActivityDetails />
        </ConsentGuard>
      </Route>
      <Route path="/join" component={QROnboarding} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/invite">
        <ConsentGuard>
          <Invite />
        </ConsentGuard>
      </Route>
      <Route path="/leaderboard">
        <ConsentGuard>
          <LeaderboardPage />
        </ConsentGuard>
      </Route>
      <Route path="/calendar">
        <ConsentGuard>
          <Calendar />
        </ConsentGuard>
      </Route>
      <Route path="/risk-score">
        <ConsentGuard>
          <RiskScoreDetails />
        </ConsentGuard>
      </Route>
      <Route path="/declined" component={Declined} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

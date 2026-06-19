import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InputData from "./pages/InputData";
import Analysis from "./pages/Analysis";
import Comments from "./pages/Comments";
import Results from "./pages/Results";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const wrap = (el: React.ReactNode) => <AppLayout>{el}</AppLayout>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={wrap(<Dashboard />)} />
            <Route path="/input" element={wrap(<InputData />)} />
            <Route path="/analisis" element={wrap(<Analysis />)} />
            <Route path="/komentar" element={wrap(<Comments />)} />
            <Route path="/hasil" element={wrap(<Results />)} />
            <Route path="/laporan" element={wrap(<Reports />)} />
            <Route path="/pengaturan" element={wrap(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

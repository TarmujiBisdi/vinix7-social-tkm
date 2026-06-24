import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InputData from "./pages/InputData";
import Analysis from "./pages/Analysis";
import Comments from "./pages/Comments";
import Results from "./pages/Results";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import EvaluasiModel from "./pages/EvaluasiModel";
import Testing from "./pages/Testing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/input-data" element={<InputData />} />
              <Route path="/analisis-sentimen" element={<Analysis />} />
              <Route path="/data-komentar" element={<Comments />} />
              <Route path="/hasil-klasifikasi" element={<Results />} />
              <Route path="/evaluasi-model" element={<EvaluasiModel />} />
              <Route path="/testing" element={<Testing />} />
              <Route path="/laporan" element={<Reports />} />
              <Route path="/pengaturan" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

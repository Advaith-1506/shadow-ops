import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import Game from "@/pages/Game";

function App() {
  const Router =
    typeof window !== "undefined" &&
    (window.shadowOpsDesktop || window.museumBreakDesktop)
      ? HashRouter
      : BrowserRouter;
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/join/:code" element={<Game />} />
          <Route path="/display/:code" element={<Game />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

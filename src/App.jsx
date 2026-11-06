import { Route, Routes, useLocation } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/LandingPage";
import MenuPage from "./pages/MenuPage";
import Game from "./pages/Game";
import PageNotFound from "./pages/PageNotFound";
import HelpPage from "./pages/HelpPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/play" element={<Game />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

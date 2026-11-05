import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CrtContext } from "./CrtContext";
import { getStoredCrt, setStoredCrt } from "../utils/preferences";
import "../styles/Crt.css";

/**
 * App-wide CRT shader: a fixed, click-through scanline + vignette layer drawn
 * above every page. The on/off choice is persisted in localStorage.
 */
export default function CrtProvider({ children }) {
  const [crtOn, setCrtOn] = useState(getStoredCrt);
  const userChoseRef = useRef(false);

  // Persist only explicit choices, so the default can keep following the OS
  // contrast preference until the player picks a side.
  useEffect(() => {
    if (userChoseRef.current) setStoredCrt(crtOn);
  }, [crtOn]);

  const toggleCrt = useCallback(() => {
    userChoseRef.current = true;
    setCrtOn((on) => !on);
  }, []);

  const value = useMemo(() => ({ crtOn, toggleCrt }), [crtOn, toggleCrt]);

  return (
    <CrtContext.Provider value={value}>
      {children}
      {crtOn && <div className="crt-overlay" aria-hidden="true" />}
    </CrtContext.Provider>
  );
}

import { useContext } from "react";
import { CrtContext } from "./CrtContext";

export default function useCrt() {
  const context = useContext(CrtContext);
  if (!context) throw new Error("useCrt must be used inside <CrtProvider>.");
  return context;
}

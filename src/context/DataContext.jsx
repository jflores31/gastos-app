/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { TRANSACTIONS, BUDGETS } from "../data/index.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [userTxs, setUserTxs]     = useLocalStorage("gastos-userTxs", []);
  const [editBudgets, setEditBudgets] = useLocalStorage("gastos-budgets", { ...BUDGETS });

  const txs = useMemo(() => [...TRANSACTIONS, ...userTxs], [userTxs]);

  const addTx = useCallback((tx) => {
    setUserTxs((prev) => [...prev, tx]);
  }, [setUserTxs]);

  const value = useMemo(() => ({
    txs,
    addTx,
    editBudgets,
    setEditBudgets,
  }), [txs, addTx, editBudgets, setEditBudgets]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
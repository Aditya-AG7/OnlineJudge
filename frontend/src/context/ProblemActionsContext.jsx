import { createContext, useContext, useState, useCallback } from 'react';

const ProblemActionsContext = createContext(null);

export function ProblemActionsProvider({ children }) {
  const [actions, setActionsState] = useState(null);

  const setActions = useCallback((newActions) => {
    setActionsState((prev) => {
      if (!prev && !newActions) return null;
      if (!newActions) return null;
      if (
        prev &&
        prev.running === newActions.running &&
        prev.submitting === newActions.submitting &&
        prev.onRun === newActions.onRun &&
        prev.onSubmit === newActions.onSubmit
      ) {
        return prev;
      }
      return newActions;
    });
  }, []);

  return (
    <ProblemActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </ProblemActionsContext.Provider>
  );
}

export function useProblemActions() {
  return useContext(ProblemActionsContext);
}

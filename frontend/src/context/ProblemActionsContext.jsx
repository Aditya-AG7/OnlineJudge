import { createContext, useContext, useState } from 'react';

const ProblemActionsContext = createContext(null);

export function ProblemActionsProvider({ children }) {
  const [actions, setActions] = useState(null);
  // actions shape when set: { onRun, onSubmit, running, submitting }
  return (
    <ProblemActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </ProblemActionsContext.Provider>
  );
}

export function useProblemActions() {
  return useContext(ProblemActionsContext);
}

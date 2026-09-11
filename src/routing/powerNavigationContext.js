import { createContext } from 'react';

// Shared power panels sit inside several independent analysis pages. The
// surrounding route supplies navigation without changing their standalone API.
export const PowerNavigationContext = createContext(null);

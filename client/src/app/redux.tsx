import { useRef } from "react"; // react hook to create a mutable reference that persists across re-renders
import { combineReducers, configureStore } from "@reduxjs/toolkit"; // functions for setting up the store
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  Provider,
} from "react-redux"; //react-redux utilities to connect Redux to a react app
import globalReducer from "@/state"; // main reducer for the app's global state
import { api } from "@/state/api"; // another reducer
import { setupListeners } from "@reduxjs/toolkit/query"; // function to set up listeners for automatic cache invalidation in queries

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"; // functions to persist the Redux store across sessions (using local storage)
import { PersistGate } from "redux-persist/integration/react"; // a component for redux-persist that delays the rendering of children until the persisted state has been restored
import createWebStorage from "redux-persist/lib/storage/createWebStorage"; // a utility to create a storage for persistance in browsers

/* REDUX PERSISTENCE */
const createNoopStorage = () => {
  // a custom storage engine that returns a promise resolving to null for environments where window is not available
  return {
    getItem(_key: any) {
      return Promise.resolve(null);
    },
    setItem(_key: any, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: any) {
      return Promise.resolve();
    },
  };
};

const storage = //if app is running in the browser it uses local storage or NoopStorage for SSR
  typeof window === "undefined"
    ? createNoopStorage()
    : createWebStorage("local");

// ensures that redux persistence only works in a browser environment and won't break in server-side rendering
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["global"],
};
const rootReducer = combineReducers({
  global: globalReducer,
  [api.reducerPath]: api.reducer,
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

/* REDUX STORE
 * makeStore: a function to configure the Redux store using the persistedReducer and some middleware
 * getDefaultMiddleware: retrieves the default middleware and disables serialization checks for Redux-Persist actions
 * api.middleware: adds middleware from the api slice for handling asynchronous requests and caching
 */
export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(api.middleware),
  });
};

/* REDUX TYPES
 * AppStore: type of the Redux store created by makeStore
 * RootState: type of the state in store.
 * AppDispatch: type for dispatching actions to the store
 * useAppDispatch & useAppSelector: Custom hooks that give you typed access to the dispatch function and Redux state in React components
 */
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* PROVIDER
 * StoreProvider: A React component that provides the Redux store and persistence to the app.
 * storeRef: A useRef hook used to create the store only once (ensuring the store doesn't get recreated on every render)
 * persistor: created using persistStore, manages persisting the store
 * Provider: wrap the children with Redux's Provider which gives access to the Redux store in the app
 * PersistGate: Ensure that the app's UI isn't rendered until the persisted state has been rehydrated
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  const persistor = persistStore(storeRef.current);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}

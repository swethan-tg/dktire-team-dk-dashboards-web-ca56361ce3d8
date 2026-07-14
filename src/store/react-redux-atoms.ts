import { createElement, useCallback } from 'react';
import {
  Provider as ReactReduxProvider,
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  AnyAction,
  applyMiddleware,
  combineReducers,
  legacy_createStore,
  Store,
} from 'redux';
import { cartReducer } from '@/store/quick-cart/cart.reducer';

type Getter = <T>(atom: ReduxAtom<T>) => T;
type SetAtomAction<T> = T | ((prev: T) => T);
type Setter = <T>(atom: ReduxAtom<T>, value: SetAtomAction<T>) => void;

type ReadFn<T> = (get: Getter) => T;
type WriteFn<T> = (get: Getter, set: Setter, value?: any) => void;

type ReduxAtom<T> = {
  id: string;
  initialValue?: T;
  read?: ReadFn<T>;
  write?: WriteFn<T>;
  storageKey?: string;
  resettable?: boolean;
};

type AtomState = {
  atoms: Record<string, unknown>;
};

type AtomAction =
  | { type: 'atom/set'; id: string; value: unknown }
  | { type: 'atom/reset'; id: string; value: unknown };

let nextAtomId = 0;

function getStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  const storedValue = localStorage.getItem(key);
  if (storedValue === null) {
    return initialValue;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return storedValue as T;
  }
}

function persistValue<T>(atomConfig: ReduxAtom<T>, value: T) {
  if (typeof window !== 'undefined' && atomConfig.storageKey) {
    localStorage.setItem(atomConfig.storageKey, JSON.stringify(value));
  }
}

function atomReducer(state: AtomState = { atoms: {} }, action: AtomAction) {
  switch (action.type) {
    case 'atom/set':
    case 'atom/reset':
      return {
        ...state,
        atoms: {
          ...state.atoms,
          [action.id]: action.value,
        },
      };
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  atoms: atomReducer,
  cart: cartReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppThunk = (
  dispatch: AppDispatch,
  getState: () => RootState
) => unknown;
export type AppDispatch = (action: AnyAction | AppThunk) => unknown;

const thunkMiddleware =
  ({ dispatch, getState }: { dispatch: AppDispatch; getState: () => RootState }) =>
  (next: (action: unknown) => unknown) =>
  (action: unknown) =>
    typeof action === 'function'
      ? (action as AppThunk)(dispatch, getState)
      : next(action);

export const reduxAtomStore = legacy_createStore(
  rootReducer as any,
  applyMiddleware(thunkMiddleware as any)
) as Store<RootState, AnyAction>;

export const useAppDispatch = () => useDispatch() as AppDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function ReduxProvider({ children }: React.PropsWithChildren<{}>) {
  return createElement(
    ReactReduxProvider as React.ComponentType<any>,
    { store: reduxAtomStore },
    children
  );
}

export function atom<T = undefined>(): ReduxAtom<T | undefined>;
export function atom<T>(read: ReadFn<T>, write?: WriteFn<T>): ReduxAtom<T>;
export function atom<T>(initialValue: T, write?: WriteFn<T>): ReduxAtom<T>;
export function atom<T>(initialValueOrRead?: T | ReadFn<T>, write?: WriteFn<T>) {
  const isDerived = typeof initialValueOrRead === 'function';

  return {
    id: `redux-atom-${nextAtomId++}`,
    initialValue: isDerived ? undefined : initialValueOrRead,
    read: isDerived ? (initialValueOrRead as ReadFn<T>) : undefined,
    write,
  } satisfies ReduxAtom<T>;
}

export function atomWithStorage<T>(key: string, initialValue: T) {
  return {
    id: `redux-atom-${nextAtomId++}`,
    initialValue: getStoredValue(key, initialValue),
    storageKey: key,
  } satisfies ReduxAtom<T>;
}

export function atomWithReset<T>(initialValue: T) {
  return {
    id: `redux-atom-${nextAtomId++}`,
    initialValue,
    resettable: true,
  } satisfies ReduxAtom<T>;
}

function readAtomValue<T>(state: AtomState, atomConfig: ReduxAtom<T>): T {
  const get: Getter = (nextAtom) => readAtomValue(state, nextAtom);

  if (atomConfig.read) {
    return atomConfig.read(get);
  }

  return (state.atoms[atomConfig.id] ?? atomConfig.initialValue) as T;
}

function resolveNextValue<T>(
  atomConfig: ReduxAtom<T>,
  state: AtomState,
  value: SetAtomAction<T>
) {
  if (typeof value === 'function') {
    return (value as (prev: T) => T)(readAtomValue(state, atomConfig));
  }

  return value;
}

export function useAtomValue<T>(atomConfig: ReduxAtom<T>) {
  return useAppSelector((state) => readAtomValue(state.atoms, atomConfig));
}

export function useSetAtom<T>(atomConfig: ReduxAtom<T>) {
  const dispatch = useAppDispatch();

  return useCallback(
    (value?: SetAtomAction<T>) => {
      const get: Getter = (nextAtom) =>
        readAtomValue(reduxAtomStore.getState().atoms as AtomState, nextAtom);
      const set: Setter = (nextAtom, nextValue) => {
        const resolvedValue = resolveNextValue(
          nextAtom,
          reduxAtomStore.getState().atoms as AtomState,
          nextValue
        );
        persistValue(nextAtom, resolvedValue);
        dispatch({
          type: 'atom/set',
          id: nextAtom.id,
          value: resolvedValue,
        });
      };

      if (atomConfig.write) {
        atomConfig.write(get, set, value as T);
        return;
      }

      const resolvedValue = resolveNextValue(
        atomConfig,
        reduxAtomStore.getState().atoms as AtomState,
        value as SetAtomAction<T>
      );
      persistValue(atomConfig, resolvedValue);
      dispatch({
        type: 'atom/set',
        id: atomConfig.id,
        value: resolvedValue,
      });
    },
    [atomConfig, dispatch]
  );
}

export function useAtom<T>(atomConfig: ReduxAtom<T>) {
  return [useAtomValue(atomConfig), useSetAtom(atomConfig)] as const;
}

export function useResetAtom<T>(atomConfig: ReduxAtom<T>) {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    persistValue(atomConfig, atomConfig.initialValue as T);
    dispatch({
      type: 'atom/reset',
      id: atomConfig.id,
      value: atomConfig.initialValue,
    });
  }, [atomConfig, dispatch]);
}

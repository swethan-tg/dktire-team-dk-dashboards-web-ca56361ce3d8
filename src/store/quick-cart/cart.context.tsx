'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useSetAtom } from '@/store/react-redux-atoms';
import {
  useAppDispatch,
  useAppSelector,
} from '@/store/react-redux-atoms';
import {
  addItemsWithQuantity,
  addItemWithQuantity,
  hydrateCartFromStorage,
  persistCartToStorage,
  removeItem,
  removeItemOrQuantity,
  resetCart as resetCartAction,
  updateCartLanguage as updateCartLanguageAction,
} from '@/store/quick-cart/cart.actions';
import { getItem, inStock } from '@/store/quick-cart/cart.utils';
import { verifiedResponseAtom } from '@/store/checkout';
import { CART_KEY } from '@/config/constants';
import { CartItem as Item } from '@/types';

export function CartProvider({
  cartKey = CART_KEY,
  children,
}: {
  cartKey?: string;
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((rootState) => rootState.cart);

  useEffect(() => {
    dispatch(hydrateCartFromStorage(cartKey));
  }, [cartKey, dispatch]);

  useEffect(() => {
    dispatch(persistCartToStorage(cartKey));
  }, [cartKey, dispatch, state]);

  return <>{children}</>;
}

export const useCart = () => {
  const state = useAppSelector((rootState) => rootState.cart);
  const dispatch = useAppDispatch();
  const emptyVerifiedResponse = useSetAtom(verifiedResponseAtom);

  const dispatchCartAction = useCallback(
    (action: Parameters<typeof dispatch>[0]) => {
      emptyVerifiedResponse(null);
      dispatch(action);
    },
    [dispatch, emptyVerifiedResponse]
  );

  const addItemsToCart = useCallback(
    (items: Item[]) => dispatchCartAction(addItemsWithQuantity(items)),
    [dispatchCartAction]
  );

  const addItemToCart = useCallback(
    (item: Item, quantity: number) =>
      dispatchCartAction(addItemWithQuantity(item, quantity)),
    [dispatchCartAction]
  );

  const removeItemFromCart = useCallback(
    (id: Item['id']) => dispatchCartAction(removeItemOrQuantity(id)),
    [dispatchCartAction]
  );

  const clearItemFromCart = useCallback(
    (id: Item['id']) => dispatchCartAction(removeItem(id)),
    [dispatchCartAction]
  );

  const getItemFromCart = useCallback(
    (id: Item['id']): any => getItem(state.items, id),
    [state.items]
  );

  const isInCart = useCallback(
    (id: Item['id']) => !!getItem(state.items, id),
    [state.items]
  );

  const isInStock = useCallback(
    (id: Item['id']) => inStock(state.items, id),
    [state.items]
  );

  const resetCart = useCallback(
    () => dispatchCartAction(resetCartAction()),
    [dispatchCartAction]
  );

  const updateCartLanguage = useCallback(
    (language: string) => dispatchCartAction(updateCartLanguageAction(language)),
    [dispatchCartAction]
  );

  return useMemo(
    () => ({
      ...state,
      addItemsToCart,
      addItemToCart,
      removeItemFromCart,
      clearItemFromCart,
      getItemFromCart,
      isInCart,
      isInStock,
      resetCart,
      updateCartLanguage,
    }),
    [
      addItemToCart,
      addItemsToCart,
      clearItemFromCart,
      getItemFromCart,
      isInCart,
      isInStock,
      removeItemFromCart,
      resetCart,
      state,
      updateCartLanguage,
    ]
  );
};

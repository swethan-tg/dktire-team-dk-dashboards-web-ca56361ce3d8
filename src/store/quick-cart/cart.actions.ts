import { CART_KEY } from '@/config/constants';
import { CartItem as Item } from '@/types';
import { AppDispatch, RootState } from '@/store/react-redux-atoms';
import { CartAction, initialState, State } from '@/store/quick-cart/cart.reducer';

export const hydrateCart = (state: State): CartAction => ({
  type: 'HYDRATE_CART',
  state,
});

export const addItemsWithQuantity = (items: Item[]): CartAction => ({
  type: 'ADD_ITEMS_WITH_QUANTITY',
  items,
});

export const addItemWithQuantity = (
  item: Item,
  quantity: number
): CartAction => ({
  type: 'ADD_ITEM_WITH_QUANTITY',
  item,
  quantity,
});

export const removeItemOrQuantity = (id: Item['id']): CartAction => ({
  type: 'REMOVE_ITEM_OR_QUANTITY',
  id,
});

export const removeItem = (id: Item['id']): CartAction => ({
  type: 'REMOVE_ITEM',
  id,
});

export const resetCart = (): CartAction => ({
  type: 'RESET_CART',
});

export const updateCartLanguage = (language: string): CartAction => ({
  type: 'UPDATE_CART_LANGUAGE',
  language,
});

export const hydrateCartFromStorage =
  (cartKey = CART_KEY) =>
  (dispatch: AppDispatch) => {
    const savedCart = localStorage.getItem(cartKey);
    dispatch(
      hydrateCart(savedCart ? (JSON.parse(savedCart) as State) : initialState)
    );
  };

export const persistCartToStorage =
  (cartKey = CART_KEY) =>
  (_dispatch: AppDispatch, getState: () => RootState) => {
    localStorage.setItem(cartKey, JSON.stringify(getState().cart));
  };

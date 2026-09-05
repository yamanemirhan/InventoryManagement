import { configureStore } from "@reduxjs/toolkit";
import { inventoryUiReducer } from "./slices/inventory-ui-slice";

export function makeStore() {
  return configureStore({ reducer: { inventoryUi: inventoryUiReducer } });
}
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

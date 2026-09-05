import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
type InventoryUiState = {
  selectedWarehouseId: string | null;
  sidebarOpen: boolean;
};
const initialState: InventoryUiState = {
  selectedWarehouseId: null,
  sidebarOpen: false,
};
const slice = createSlice({
  name: "inventoryUi",
  initialState,
  reducers: {
    setSelectedWarehouseId(state, action: PayloadAction<string | null>) {
      state.selectedWarehouseId = action.payload;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});
export const { setSelectedWarehouseId, setSidebarOpen } = slice.actions;
export const inventoryUiReducer = slice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type InventoryUiState = { selectedWarehouseId: string | null };
const initialState: InventoryUiState = { selectedWarehouseId: null };
const inventoryUiSlice = createSlice({
  name: "inventoryUi",
  initialState,
  reducers: { setSelectedWarehouseId(state, action: PayloadAction<string | null>) { state.selectedWarehouseId = action.payload; } },
});

export const { setSelectedWarehouseId } = inventoryUiSlice.actions;
export const inventoryUiReducer = inventoryUiSlice.reducer;

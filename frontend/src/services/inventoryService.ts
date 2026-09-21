import api from './api';
import { InventoryItem } from '../types';

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-01',
    name: 'Urea (46% Nitrogen Fertilizer)',
    category: 'Fertilizers',
    quantity: 12,
    unit: 'bags (50kg)',
    reorderLevel: 20,
    status: 'Low Stock',
    supplier: 'AgriCorp Supplies Ltd.',
    pricePerUnit: 28.5,
  },
  {
    id: 'inv-02',
    name: 'NPK 15-15-15 Complex Fertilizer',
    category: 'Fertilizers',
    quantity: 45,
    unit: 'bags (50kg)',
    reorderLevel: 15,
    status: 'In Stock',
    supplier: 'SoilNutrient Global',
    pricePerUnit: 32.0,
  },
  {
    id: 'inv-03',
    name: 'Tomato Seeds (Roma VF Hybrid)',
    category: 'Seeds',
    quantity: 5,
    unit: 'kg',
    reorderLevel: 2,
    status: 'In Stock',
    supplier: 'AgriSeed Genetics',
    pricePerUnit: 120.0,
  },
  {
    id: 'inv-04',
    name: 'Copper Fungicide (Blight Control)',
    category: 'Pesticides',
    quantity: 1,
    unit: 'liters',
    reorderLevel: 5,
    status: 'Low Stock',
    supplier: 'BioCrop Protection Inc.',
    pricePerUnit: 45.0,
  },
  {
    id: 'inv-05',
    name: 'Drip Irrigation Emitters (2L/hr)',
    category: 'Tools',
    quantity: 250,
    unit: 'pieces',
    reorderLevel: 50,
    status: 'In Stock',
    supplier: 'Irrigation Direct',
    pricePerUnit: 1.2,
  },
  {
    id: 'inv-06',
    name: 'Tractor Fuel (Diesel)',
    category: 'Equipment',
    quantity: 0,
    unit: 'liters',
    reorderLevel: 100,
    status: 'Out of Stock',
    supplier: 'National Fuel Energy',
    pricePerUnit: 1.45,
  },
];

export const inventoryService = {
  getInventory: async (): Promise<InventoryItem[]> => {
    try {
      const res = await api.get('/inventory');
      if (Array.isArray(res.data)) {
        return res.data.map((item: any) => ({
          ...item,
          id: item._id || item.id
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend API unavailable, using local mock data:', err);
      return MOCK_INVENTORY;
    }
  },

  addItem: async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
    try {
      const res = await api.post('/inventory', item);
      return {
        ...res.data,
        id: res.data._id || res.data.id
      };
    } catch {
      const q = item.quantity || 10;
      const r = item.reorderLevel || 5;
      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (q === 0) status = 'Out of Stock';
      else if (q <= r) status = 'Low Stock';

      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: item.name || 'New Farm Item',
        category: item.category || 'Tools',
        quantity: q,
        unit: item.unit || 'units',
        reorderLevel: r,
        status,
        supplier: item.supplier || 'General Agri Supply',
        pricePerUnit: item.pricePerUnit || 10.0,
      };
      MOCK_INVENTORY.unshift(newItem);
      return newItem;
    }
  },

  deleteItem: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/inventory/${id}`);
      return true;
    } catch {
      const idx = MOCK_INVENTORY.findIndex((i) => i.id === id);
      if (idx !== -1) MOCK_INVENTORY.splice(idx, 1);
      return true;
    }
  },
};

import { offline } from '@redux-offline/redux-offline';
import offlineConfig from '@redux-offline/redux-offline/lib/defaults';
import type { PayloadAction, StoreEnhancer, Tuple } from '@reduxjs/toolkit';
import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import type { PersistConfig, PersistedState } from 'redux-persist';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { API_URL } from '@/config/api';
import type {
  AttendanceRecord,
  AttendanceState,
  AttendanceStatus,
} from '@/lib/attendance/types';
import { AttendanceEventType } from '@/lib/attendance/types';
import type { User } from '@/lib/user/type';
import type { Transaction } from '@/types/transaction.types';

interface UsersState {
  users: User[];
  loading: boolean;
  error: null | string;
}

interface TransactionsState {
  records: { [userId: number]: Transaction[] };
  loading: boolean;
  error: null | string;
}

interface UpdateAttendancePayload {
  userId: number;
  date: string;
  status: AttendanceStatus;
  meta?: {
    offline: {
      effect: {
        url: string;
        method: string;
        body: {
          date: string;
          status: AttendanceStatus;
        };
      };
      commit: { type: string };
      rollback: {
        type: string;
        meta: {
          userId: number;
          date: string;
          previousStatus?: AttendanceStatus;
        };
      };
    };
  };
}

// Disable no-param-reassign for the entire file since we're using Redux Toolkit with Immer
/* eslint-disable no-param-reassign */

// User slice
const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  } as UsersState,
  reducers: {
    setUsers: (state: UsersState, action: PayloadAction<User[]>) => {
      state.users = [...action.payload];
    },
    updateUser: (state: UsersState, action: PayloadAction<User>) => {
      const index = state.users.findIndex(
        (user: User) => user.id === action.payload.id,
      );
      if (index !== -1) {
        state.users = [
          ...state.users.slice(0, index),
          action.payload,
          ...state.users.slice(index + 1),
        ];
      }
    },
  },
});

// Attendance slice
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: {},
    loading: false,
    error: null,
  } as AttendanceState,
  reducers: {
    setAttendanceRecords: (
      state: AttendanceState,
      action: PayloadAction<{ userId: number; records: AttendanceRecord[] }>,
    ) => {
      state.records = {
        ...state.records,
        [action.payload.userId]: action.payload.records,
      };
    },
    updateAttendance: (
      state,
      action: PayloadAction<UpdateAttendancePayload>,
    ) => {
      const { userId, date, status } = action.payload;
      const records = [...(state.records[userId] ?? [])];
      const recordIndex = records.findIndex((record) => record.date === date);

      if (recordIndex >= 0) {
        const existingRecord = records[recordIndex]!;
        records[recordIndex] = {
          userId: existingRecord.userId,
          date: existingRecord.date,
          status,
          eventType: existingRecord.eventType,
          id: existingRecord.id,
          timeIn: existingRecord.timeIn,
          type: existingRecord.type,
          justification: existingRecord.justification,
        };
      } else {
        const newRecord: AttendanceRecord = {
          userId,
          date,
          status,
          eventType: AttendanceEventType.REHEARSAL,
          id: Date.now(),
          timeIn: new Date().toISOString(),
        };
        records.push(newRecord);
      }

      state.records[userId] = records;
    },
  },
});

// Transactions slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    records: {},
    loading: false,
    error: null,
  } as TransactionsState,
  reducers: {
    setTransactions: (
      state: TransactionsState,
      action: PayloadAction<{ userId: number; transactions: Transaction[] }>,
    ) => {
      state.records = {
        ...state.records,
        [action.payload.userId]: action.payload.transactions,
      };
    },
    addTransaction: (
      state: TransactionsState,
      action: PayloadAction<{ userId: number; transaction: Transaction }>,
    ) => {
      const { userId, transaction } = action.payload;
      const records = [...(state.records[userId] ?? [])];
      records.push(transaction);
      state.records = {
        ...state.records,
        [userId]: records,
      };
    },
  },
});

export type RootState = {
  users: UsersState;
  attendance: AttendanceState;
  transactions: TransactionsState;
};

const rootReducer = combineReducers({
  users: userSlice.reducer,
  attendance: attendanceSlice.reducer,
  transactions: transactionSlice.reducer,
});

const persistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
  whitelist: ['users', 'attendance', 'transactions'],
  version: 1,
  // eslint-disable-next-line no-underscore-dangle
  migrate: (state: any) => {
    return Promise.resolve({
      users: { users: [], loading: false, error: null },
      attendance: { records: {}, loading: false, error: null },
      transactions: { records: {}, loading: false, error: null },
      // eslint-disable-next-line no-underscore-dangle
      _persist: state?._persist ?? { version: 1, rehydrated: true },
    } as PersistedState);
  },
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const exportDataOffline = (
  type: 'attendance' | 'transactions',
  filters?: any,
) => ({
  type: `${type}/export`,
  payload: { filters },
  meta: {
    offline: {
      effect: {
        url: `${API_URL}/${type}/export`,
        method: 'POST',
        body: filters,
        responseType: 'blob',
        headers: {
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      },
      commit: { type: `${type}/exportSuccess` },
      rollback: { type: `${type}/exportFailure` },
    },
  },
});

// Modify the offline config to handle blob responses
const offlineEnhancerConfig = {
  ...offlineConfig,
  retry: (_action: any, retries: number) => {
    const delay = 2 ** retries * 1000;
    return delay < 1000 * 60 * 10 ? delay : undefined;
  },
  persistOptions: {
    whitelist: ['offline', 'users', 'attendance', 'transactions'],
  },
  effect: async (effect: any) => {
    const response = await fetch(effect.url, {
      method: effect.method,
      headers: {
        'Content-Type': 'application/json',
        ...effect.headers,
      },
      body: JSON.stringify(effect.body),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    if (effect.responseType === 'blob') {
      const blob = await response.blob();
      const fileName =
        response.headers.get('content-disposition')?.split('filename=')[1] ||
        'export.xlsx';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, fileName };
    }

    return response.json();
  },
  discard: (error: any, _action: any, _retries: number) => {
    const { status } = error.response || {};
    return status && status < 500;
  },
  defaultCommit: { type: 'OFFLINE_COMMIT' },
  defaultRollback: { type: 'OFFLINE_ROLLBACK' },
};

const enhancers = (defaultEnhancers: () => StoreEnhancer[]) => {
  const enhancerArray = [...defaultEnhancers()];
  const finalEnhancers = enhancerArray.concat(
    offline(offlineEnhancerConfig) as StoreEnhancer,
  );
  return Object.assign(finalEnhancers, { prepend: () => {} }) as Tuple<
    StoreEnhancer[]
  >;
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  enhancers,
});

export const persistor = persistStore(store);

// Export actions
export const { setUsers, updateUser } = userSlice.actions;
export const { setAttendanceRecords, updateAttendance } =
  attendanceSlice.actions;
export const { setTransactions, addTransaction } = transactionSlice.actions;

export type AppDispatch = typeof store.dispatch;

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: () => StoreEnhancer;
  }
}

// Add offline action creators for users and transactions
export const updateUserOffline = (userId: number, userData: Partial<User>) => ({
  type: 'users/updateUser',
  payload: userData,
  meta: {
    offline: {
      effect: {
        url: `${API_URL}/users/${userId}`,
        method: 'PUT',
        body: userData,
      },
      commit: { type: 'users/updateUserSuccess' },
      rollback: { type: 'users/updateUserFailure' },
    },
  },
});

export const addTransactionOffline = (
  userId: number,
  transaction: Omit<Transaction, 'id'>,
) => ({
  type: 'transactions/addTransaction',
  payload: { userId, transaction },
  meta: {
    offline: {
      effect: {
        url: `${API_URL}/transactions`,
        method: 'POST',
        body: { ...transaction, userId },
      },
      commit: { type: 'transactions/addTransactionSuccess' },
      rollback: { type: 'transactions/addTransactionFailure' },
    },
  },
});

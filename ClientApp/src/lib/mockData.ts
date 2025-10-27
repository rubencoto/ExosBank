// Mock data para el sistema EXOS Bank

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
  status: 'active' | 'inactive';
  cedula?: string;
  phone?: string;
  address?: string;
}

export interface Account {
  id: number;
  clientId: number;
  clientName: string;
  type: 'debit' | 'savings' | 'credit';
  accountNumber: string;
  balance: number;
}

export interface Transaction {
  id: number;
  date: string;
  type: 'transfer' | 'deposit' | 'withdrawal';
  amount: number;
  fromAccount: string;
  toAccount: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Admin Usuario',
    email: 'admin@exosbank.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: 2,
    name: 'Juan Pérez Solís',
    email: 'juan.perez@email.com',
    role: 'client',
    status: 'active',
    cedula: '1-0234-0567',
    phone: '+506 8234 5678',
    address: 'Barrio Escalante, San José',
  },
  {
    id: 3,
    name: 'María García Rojas',
    email: 'maria.garcia@email.com',
    role: 'client',
    status: 'active',
    cedula: '1-0876-0543',
    phone: '+506 8765 4321',
    address: 'Centro, Alajuela',
  },
  {
    id: 4,
    name: 'Carlos López Vargas',
    email: 'carlos.lopez@email.com',
    role: 'client',
    status: 'active',
    cedula: '1-1122-0334',
    phone: '+506 7111 2222',
    address: 'San Francisco, Heredia',
  },
  {
    id: 5,
    name: 'Ana Martínez Quesada',
    email: 'ana.martinez@email.com',
    role: 'client',
    status: 'inactive',
    cedula: '1-0554-0332',
    phone: '+506 6333 4444',
    address: 'Oriental, Cartago',
  },
];

export const mockAccounts: Account[] = [
  {
    id: 1,
    clientId: 2,
    clientName: 'Juan Pérez',
    type: 'debit',
    accountNumber: '1000-0001',
    balance: 5420.50,
  },
  {
    id: 2,
    clientId: 2,
    clientName: 'Juan Pérez',
    type: 'savings',
    accountNumber: '2000-0001',
    balance: 12850.75,
  },
  {
    id: 3,
    clientId: 2,
    clientName: 'Juan Pérez',
    type: 'credit',
    accountNumber: '3000-0001',
    balance: 3000.00,
  },
  {
    id: 4,
    clientId: 3,
    clientName: 'María García',
    type: 'debit',
    accountNumber: '1000-0002',
    balance: 8765.30,
  },
  {
    id: 5,
    clientId: 3,
    clientName: 'María García',
    type: 'savings',
    accountNumber: '2000-0002',
    balance: 25600.00,
  },
  {
    id: 6,
    clientId: 4,
    clientName: 'Carlos López',
    type: 'debit',
    accountNumber: '1000-0003',
    balance: 3245.80,
  },
  {
    id: 7,
    clientId: 4,
    clientName: 'Carlos López',
    type: 'credit',
    accountNumber: '3000-0002',
    balance: 5000.00,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    date: '2025-10-15T10:30:00',
    type: 'transfer',
    amount: 250.00,
    fromAccount: '1000-0001',
    toAccount: '1000-0002',
    description: 'Pago de servicios',
    status: 'completed',
  },
  {
    id: 2,
    date: '2025-10-15T09:15:00',
    type: 'deposit',
    amount: 1000.00,
    fromAccount: 'External',
    toAccount: '2000-0001',
    description: 'Depósito salario',
    status: 'completed',
  },
  {
    id: 3,
    date: '2025-10-14T16:45:00',
    type: 'transfer',
    amount: 150.50,
    fromAccount: '1000-0001',
    toAccount: '1000-0003',
    description: 'Transferencia personal',
    status: 'completed',
  },
  {
    id: 4,
    date: '2025-10-14T14:20:00',
    type: 'withdrawal',
    amount: 500.00,
    fromAccount: '1000-0002',
    toAccount: 'ATM',
    description: 'Retiro cajero automático',
    status: 'completed',
  },
  {
    id: 5,
    date: '2025-10-13T11:00:00',
    type: 'transfer',
    amount: 75.25,
    fromAccount: '1000-0003',
    toAccount: '1000-0001',
    description: 'Pago compartido',
    status: 'completed',
  },
  {
    id: 6,
    date: '2025-10-13T08:30:00',
    type: 'deposit',
    amount: 2500.00,
    fromAccount: 'External',
    toAccount: '2000-0002',
    description: 'Transferencia externa',
    status: 'completed',
  },
  {
    id: 7,
    date: '2025-10-12T15:45:00',
    type: 'transfer',
    amount: 320.00,
    fromAccount: '1000-0002',
    toAccount: '1000-0001',
    description: 'Reembolso',
    status: 'completed',
  },
  {
    id: 8,
    date: '2025-10-12T12:10:00',
    type: 'withdrawal',
    amount: 200.00,
    fromAccount: '1000-0001',
    toAccount: 'ATM',
    description: 'Retiro cajero',
    status: 'completed',
  },
];

export const getDailyTransactionData = () => {
  return [
    { date: '10/09', transactions: 45, amount: 12500 },
    { date: '10/10', transactions: 52, amount: 15800 },
    { date: '10/11', transactions: 38, amount: 9200 },
    { date: '10/12', transactions: 61, amount: 18400 },
    { date: '10/13', transactions: 48, amount: 14100 },
    { date: '10/14', transactions: 55, amount: 16700 },
    { date: '10/15', transactions: 42, amount: 13200 },
  ];
};

export const getAccountTypeData = () => {
  return [
    { type: 'Débito', count: 3, color: '#10b981' },
    { type: 'Ahorro', count: 2, color: '#3b82f6' },
    { type: 'Crédito', count: 2, color: '#ef4444' },
  ];
};

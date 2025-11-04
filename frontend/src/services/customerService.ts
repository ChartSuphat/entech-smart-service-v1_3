import api from '../utils/axios';
import type { Customer } from '../types/customer';

export const getCustomers = async (): Promise<Customer[]> => {
  const res = await api.get('/customers');
  return res.data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const res = await api.get(`/customers/${id}`);
  return res.data;
};

export const addCustomer = async (customer: Customer): Promise<Customer> => {
  const res = await api.post('/customers', customer);
  return res.data;
};

export const updateCustomer = async (id: number, customer: Customer): Promise<Customer> => {
  const res = await api.put(`/customers/${id}`, customer);
  return res.data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

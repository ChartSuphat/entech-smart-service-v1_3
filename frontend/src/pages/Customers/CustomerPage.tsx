import { useEffect, useState } from "react";
import axios from "axios";
import CustomersTable from "../../components/Customers/CustomersTable";
import CustomersModal from "../../components/Customers/CustomersModal";
import api from "../../utils/axios";

type Customer = {
  customerId: string;
  companyName: string;
  address: string;
  companyNameTH?: string;
  addressTH?: string;
  contactPerson: string;
  email: string;
  phone: string;
};

const CustomerPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user can modify customers (admin or technician)
  const canModify = user?.role === 'admin' || user?.role === 'technician';

  const fetchUserInfo = async () => {
    try {
      // const response = await fetch('/auth/me', {
      //   credentials: 'include'
      // });

      
      // if (response.ok) {
      //   const userData = await response.json();
      //   setUser(userData.data);
      //   console.log('User loaded:', userData.data?.role);
      // }

      const res = await api.get('/auth/me');
      console.log("Ahhhhhh: ", res.data.data);
      if (res.status == 200) {
        const userData = res.data.data;
        setUser(userData);
      } else {
        console.log("Faileddd");
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Fallback for development
      setUser({ id: 1, role: 'admin', fullName: 'Admin User' });
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/customers");
      console.log('Raw customer data from API:', res);
      console.log('First customer structure:', res.data[0]);
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchCustomers();
  }, []);

  const handleCreate = async (customerData: Customer) => {
    try {
      setIsLoading(true);
      console.log('Creating customer with data:', customerData);
      const result = await api.post("/customers", customerData);
      console.log("Create customer result: ", result);
      await fetchCustomers();
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to create customer", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (customerData: Customer) => {
    try {
      setIsLoading(true);
      console.log('Editing customer with ID:', customerData.customerId);
      console.log('Customer data:', customerData);
      
      if (!customerData.customerId) {
        throw new Error('Customer ID is required for editing');
      }
      
      await api.post(`/customers/${customerData.customerId}`, customerData);
      await fetchCustomers();
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to edit customer", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (customerData: Customer) => {
    if (editingCustomer) {
      await handleEdit(customerData);
    } else {
      await handleCreate(customerData);
    }
  };

  const openCreateModal = () => {
    console.log('Opening create modal');
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    console.log('Opening edit modal for customer:', customer);
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (customerId: string) => {
    console.log('Deleting customer with ID:', customerId);
    
    if (!customerId) {
      console.error('No customer ID provided');
      alert('Error: No customer ID provided');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setIsLoading(true);
        console.log('Sending delete request to:', `/api/customers/${customerId}`);
        await api.delete(`/customers/${customerId}`);
        await fetchCustomers();
        // Close modal if it's open
        if (isModalOpen) {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }
      } catch (err) {
        console.error("Failed to delete customer", err);
        alert('Failed to delete customer. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-8">Customers</h1>

      <CustomersTable
        customers={customers}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAdd={openCreateModal}
        canModify={canModify}
        isLoading={isLoading}
      />

      <CustomersModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        customer={editingCustomer}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CustomerPage;
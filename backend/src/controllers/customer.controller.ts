import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,           // cuid primary key
        customerId: true,   // This is what frontend needs
        companyName: true,
        address: true,
        companyNameTH: true,
        addressTH: true,
        contactPerson: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });
    console.log('Sending customers:', customers); // Add this debug
    res.json(customers);
  } catch (err: any) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const newCustomer = await prisma.customer.create({ data: req.body });
    res.status(201).json(newCustomer);
  } catch (err) {
    console.error("Error creating customer:", err);
    res.status(500).json({ message: "Failed to create customer" });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('Updating customer with customerId:', id);
  console.log('Request body:', req.body);
  
  try {
    const updated = await prisma.customer.update({
      where: { customerId: id },
      data: req.body,
    });
    console.log('Update successful:', updated);
    res.json(updated);
  } catch (err: any) {
    console.error("Error updating customer:", err);
    res.status(500).json({ 
      message: "Failed to update customer",
      error: err.message
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.customer.delete({
      where: { customerId: id },
    });
    res.status(200).json({ 
      success: true, 
      message: "Customer deleted successfully" 
    });
  } catch (err: any) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ message: "Failed to delete customer" });
  }
};
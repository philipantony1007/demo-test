import { Request, Response } from 'express';
import { updateCustomer } from '../customers/update.customer';
import { Customer } from '@commercetools/platform-sdk';

export const post = async (req: Request, res: Response): Promise<void> => {
  try {

    const updatedCustomer: Customer = await updateCustomer();
    res.status(200).json(updatedCustomer);

  } catch (error: any) 
  {
    console.error('Error in post handler:', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

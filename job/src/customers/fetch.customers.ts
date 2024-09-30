import { CustomerPagedQueryResponse, OrderPagedQueryResponse } from '@commercetools/platform-sdk';

import { createApiRoot } from '../client/create.client';
import { getAll } from './modifier.customers';
import { GetFunction } from '../types/index.types';

const getCustomerSet: GetFunction<CustomerPagedQueryResponse> = async (queryArgs) => {
  // Return all the orders
  const { body } = await createApiRoot().customers().get({ queryArgs }).execute();
  return body;
};

export const allCustomers: GetFunction<CustomerPagedQueryResponse> =
  getAll(getCustomerSet);

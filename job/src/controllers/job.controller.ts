import { Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import {allCustomers} from '../customers/fetch.customers'

/**
 * Exposed job endpoint.
 *
 * @param {Request} _request The express request
 * @param {Response} response The express response
 * @returns
 */
export const post = async (_request: Request, response: Response) => {
  try {
    // Get the orders
   // const limitedOrdersObject = await allOrders({ sort: ['lastModifiedAt'] });
   const limitedCustomersObject = await allCustomers({ sort: ['lastModifiedAt'] });


   logger.info(`There are ${limitedCustomersObject.total} customers!`);

    response.status(200).send(limitedCustomersObject);
  } catch (error) {
    throw new CustomError(
      500,
      `Internal Server Error - Error retrieving all orders from the commercetools SDK`
    );
  }
};

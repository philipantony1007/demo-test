import { Request, Response } from 'express';
import axios from 'axios';  // Using axios for the API call
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { allOrders } from '../orders/fetch.orders';

const currencyConverterApiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * Fetches the latest exchange rates from the API.
 * @returns {Promise<Record<string, number>>} Exchange rates as an object, where the key is the currency code.
 */
const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    const response = await axios.get(currencyConverterApiUrl);
    return response.data.rates;  // Returns the exchange rates object
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    throw new CustomError(500, 'Failed to fetch exchange rates');
  }
};

/**
 * Exposed job endpoint to retrieve order details with currency conversions.
 *
 * @param {Request} req The express request
 * @param {Response} res The express response
 */
export const post = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch the latest exchange rates
    const exchangeRates = await fetchExchangeRates();

    // Get the orders
    const limitedOrdersObject = await allOrders({ sort: ['lastModifiedAt'] });

    if (!limitedOrdersObject || limitedOrdersObject.results.length === 0) {
      logger.info('No completed orders found.');
      res.status(404).json({ message: 'No completed orders found.' });
      return;
    }

    // Prepare the final result array to contain customer-specific information
    const result: any[] = [];

    // Grouping logic: Prepare an object to group orders by customerId
    const customerGroups: Record<string, {
      customerId: string;
      totalOrders: number;
      totalAmountInDollars: number;
      orders: any[];

    }> = {};

    limitedOrdersObject.results.forEach((order) => {
      const orderAmountInCents: number = order.totalPrice.centAmount;
      const currencyCode: string = order.totalPrice.currencyCode;
      const fractionDigits: number = order.totalPrice.fractionDigits;

      // Use exchange rate; default to USD if rate is not available
      const rate: number = exchangeRates[currencyCode] || exchangeRates.USD;

      // Convert amount using the fractionDigits property
      const amountInCurrency: number = orderAmountInCents / Math.pow(10, fractionDigits);

      // Convert to dollars using the exchange rate
      const amountInDollars: number = amountInCurrency / rate;

      const orderDetails = {
        orderId: order.id,
        orderAmount: amountInCurrency, // Format to correct decimal places
        currencyCode: currencyCode,
        amountInDollars: amountInDollars // Always format to two decimal places for dollars
      };

      // Ensure customerId is defined and use it as the key, fallback to 'UnknownCustomer'
      const customerId = order.customerId || 'UnknownCustomer';

      // Initialize the customer group if it doesn't exist
      if (!customerGroups[customerId]) {
        customerGroups[customerId] = {
          customerId: customerId,
          totalOrders: 0,
          totalAmountInDollars: 0,
          orders: []
        };
      }

      // Add order details to the customer's group
      customerGroups[customerId].orders.push(orderDetails);
      customerGroups[customerId].totalOrders++;
      customerGroups[customerId].totalAmountInDollars += orderDetails.amountInDollars;
    });

    // Convert customerGroups object into an array for the result
    for (const customerId in customerGroups) {
      result.push(customerGroups[customerId]);
    }

    logger.info(`There are ${limitedOrdersObject.total} completed orders!`);

    // Send the formatted result as a JSON response
    res.status(200).json({ total: limitedOrdersObject.total, result });
  } catch (error) {
    logger.error(`Error retrieving all orders: ${error}`);
    throw new CustomError(500, 'Internal Server Error - Error retrieving all orders from the commercetools SDK');
  }
};

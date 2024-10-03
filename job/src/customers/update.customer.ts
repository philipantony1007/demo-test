import { Customer } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/create.client';


const customerId = 'd04d265d-44fb-4cee-8018-260c1ef0e86d'; // Customer ID

interface ProductUpdate {
  version: number;
}

// Function to fetch account version
async function fetchAccountVersion(customerId: string): Promise<number | undefined> {
  try {
    const commercetoolsAccount = await createApiRoot()
      .customers()
      .withId({ ID: customerId }) // Use customerId to fetch the customer data
      .get()
      .execute();
    
    const customerUpdate: ProductUpdate = {
      version: commercetoolsAccount.body?.version ?? 0, // Safely retrieve version or default to 0
    };

    return customerUpdate.version; // Return the version
  } catch (error: any) {
    // Log and handle error
    throw new Error(error);
  }
}

// Function to update customer segment
export const updateCustomer = async (): Promise<Customer> => {
  try {
    // Fetch the current version of the customer
    const version = await fetchAccountVersion(customerId);

    if (!version) {
      throw new Error('Failed to retrieve customer version');
    }

    // Call the API to update customer segment to "Silver"
    const { body } = await createApiRoot()
      .customers()
      .withId({ ID: customerId }) // Update the specific customer by ID
      .post({
        body: {
          version: version, // Use the fetched version
          actions: [
            {
              action: 'setCustomField',
              name: 'customersegment',
              value: 'Gold', // Set the segment value to "Silver"
            },
          ],
        },
      })
      .execute();

    return body; // Return the updated customer
  } catch (error: any) {
    // Log the entire error object for diagnosis
    console.error('Error while updating customer:', error);

    // If CommerceTools provides a response, attach it to the error
    const errorMessage = error.body ? error.body.message : error.message || 'Unknown error occurred';
    throw new Error(`Failed to update customer: ${errorMessage}`);
  }
};

import axios from 'axios';

interface CreateVirtualAccountParams {
  email: string;
  currency?: string;
  amount?: number;
  tx_ref: string;
  is_permanent?: boolean;
  narration?: string;
  bvn?: string;
  phonenumber?: string;
}

interface VirtualAccountResponse {
  status: string;
  message: string;
  data: {
    response_code: string;
    response_message: string;
    flw_ref: string;
    order_ref: string;
    account_number: string;
    frequency: string;
    bank_name: string;
    created_at: string;
    expiry_date: string;
    note: string;
    amount: number | null;
  };
}

const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

// Add detailed logging for debugging
console.log('Flutterwave configuration:', {
  apiUrl: FLUTTERWAVE_API_URL,
  hasSecretKey: !!FLUTTERWAVE_SECRET_KEY,
  keyPrefix: FLUTTERWAVE_SECRET_KEY ? FLUTTERWAVE_SECRET_KEY.substring(0, 10) + '...' : 'not set'
});

if (!FLUTTERWAVE_SECRET_KEY) {
  throw new Error('Flutterwave secret key is not configured. Please check your .env file.');
}

// Verify the key format
if (!FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK_')) {
  console.warn('Warning: Flutterwave secret key may be in incorrect format. Should start with FLWSECK_');
}

export const createVirtualAccount = async (params: CreateVirtualAccountParams): Promise<VirtualAccountResponse['data']> => {
  try {
    console.log('Creating virtual account with params:', { ...params, email: params.email });
    const response = await axios.post<VirtualAccountResponse>(
      `${FLUTTERWAVE_API_URL}/virtual-account-numbers`,
      {
        email: params.email,
        currency: params.currency || 'NGN',
        amount: params.amount || 2000,
        tx_ref: params.tx_ref,
        is_permanent: params.is_permanent || false,
        narration: params.narration || `Please make a bank transfer to ${params.email}`,
        phonenumber: params.phonenumber || '',
        bvn: params.bvn
      },
      {
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to create virtual account');
    }

    console.log('Virtual account created successfully:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating virtual account:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid Flutterwave API credentials. Please check your secret key.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API permissions.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
    }
    throw error;
  }
};

export async function verifyBVN(bvn: string) {
  try {
    const response = await fetch(`${FLUTTERWAVE_API_URL}/kyc/bvns/${bvn}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify BVN');
    }

    return response.json();
  } catch (error) {
    console.error('Error verifying BVN:', error);
    throw error;
  }
}

// Test function for virtual account creation
export const testVirtualAccountCreation = async () => {
  try {
    console.log('Starting virtual account creation test...');
    
    // Test parameters
    const testParams = {
      email: 'test@example.com',
      tx_ref: `TEST-${Date.now()}`,
      phonenumber: '08012345678',
      narration: 'Test Virtual Account',
      is_permanent: true
    };

    console.log('Test parameters:', testParams);

    // Attempt to create virtual account
    const virtualAccount = await createVirtualAccount(testParams);
    
    console.log('Virtual account created successfully:', {
      accountNumber: virtualAccount.account_number,
      bankName: virtualAccount.bank_name,
      flwRef: virtualAccount.flw_ref,
      orderRef: virtualAccount.order_ref,
      createdAt: virtualAccount.created_at
    });

    return virtualAccount;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};
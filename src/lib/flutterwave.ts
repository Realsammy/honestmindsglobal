import axios from 'axios'

const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3'
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!

interface VirtualAccountResponse {
  status: string
  message: string
  data: {
    response_code: string
    response_message: string
    flw_ref: string
    order_ref: string
    account_number: string
    account_name: string
    bank_name: string
    created_at: string
    expiry_date: string
    note: string
    amount: string
  }
}

export async function createVirtualAccount(
  email: string,
  fullName: string,
  phone: string,
  userId: string
): Promise<{
  accountNumber: string
  accountName: string
  bankName: string
  flwRef: string
  orderRef: string
}> {
  try {
    const response = await axios.post<VirtualAccountResponse>(
      `${FLUTTERWAVE_API_URL}/virtual-account-numbers`,
      {
        email,
        is_permanent: true,
        bvn: '',
        tx_ref: `VA-${userId}-${Date.now()}`,
        amount: '0',
        customer: {
          name: fullName,
          email,
          phone,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.status !== 'success') {
      throw new Error(response.data.message)
    }

    const { account_number, account_name, bank_name, flw_ref, order_ref } = response.data.data

    return {
      accountNumber: account_number,
      accountName: account_name,
      bankName: bank_name,
      flwRef: flw_ref,
      orderRef: order_ref,
    }
  } catch (error) {
    console.error('Flutterwave virtual account creation error:', error)
    throw new Error('Failed to create virtual account')
  }
}

export async function deactivateVirtualAccount(flwRef: string): Promise<void> {
  try {
    await axios.post(
      `${FLUTTERWAVE_API_URL}/virtual-account-numbers/${flwRef}/deactivate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Flutterwave virtual account deactivation error:', error)
    throw new Error('Failed to deactivate virtual account')
  }
} 
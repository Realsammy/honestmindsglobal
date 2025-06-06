import Link from 'next/link';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent you an email with a link to verify your account.
          Please check your inbox and follow the instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the email?{' '}
                <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Return to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 

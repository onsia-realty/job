import { redirect } from 'next/navigation';

export default function SalesSignupRedirect() {
  redirect('/agent/auth/signup?role=sales');
}

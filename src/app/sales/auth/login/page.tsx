import { redirect } from 'next/navigation';

export default function SalesLoginRedirect() {
  redirect('/agent/auth/login?role=sales');
}

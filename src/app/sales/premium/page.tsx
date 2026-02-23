import { redirect } from 'next/navigation';

export default function SalesPremiumRedirect() {
  redirect('/premium?category=sales');
}

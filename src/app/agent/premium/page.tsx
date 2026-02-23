import { redirect } from 'next/navigation';

export default function AgentPremiumRedirect() {
  redirect('/premium?category=agent');
}

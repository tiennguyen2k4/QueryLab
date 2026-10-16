import type { Metadata } from 'next';
import { ConnectionsPage } from '@/components/connections-page';
export const metadata: Metadata = { title: 'Kết nối database', description: 'Kết nối PostgreSQL trên máy bạn để đo và tối ưu query.' };
export default function Page() { return <ConnectionsPage/>; }

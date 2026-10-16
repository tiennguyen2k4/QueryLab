import { notFound, redirect } from 'next/navigation';
import { labs } from '@/content/labs';
import { LabWorkspace } from '@/components/lab-workspace';
import { localizeLab } from '@/lib/lab-localization';
export function generateStaticParams(){return labs.map(l=>({id:l.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const original=labs.find(l=>l.id===id);const lab=original?localizeLab(original,'vi'):undefined;return {title:lab?.title||'Không tìm thấy bài học',description:lab?.task};}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const lab=labs.find(l=>l.id===id);if(!lab)notFound();if(lab.category==='sql')redirect('/paths');return <LabWorkspace lab={lab}/>;}

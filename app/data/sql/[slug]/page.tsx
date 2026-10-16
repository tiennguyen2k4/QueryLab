import { notFound } from 'next/navigation';
import { labs } from '@/content/labs';
import { ConceptArticle } from '@/components/concept-article';
import { localizeLab } from '@/lib/lab-localization';
export function generateStaticParams(){return labs.map(l=>({slug:l.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const source=labs.find(l=>l.slug===slug);const lab=source?localizeLab(source,'vi'):undefined;return {title:lab?`${lab.title}: giải thích`:'Không tìm thấy khái niệm',description:lab?.concept};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const lab=labs.find(l=>l.slug===slug);if(!lab)notFound();return <ConceptArticle labId={lab.id}/>;}

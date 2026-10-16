'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';
export function PageEvents(){const path=usePathname();useEffect(()=>{if(path==='/pricing')track('pricing_viewed');},[path]);return null;}

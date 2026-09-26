import 'server-only';
import { cache } from 'react';
import { db } from './db';
import { isConfigured } from './config';
import initialProjects from '../../content/projects.json';
import type { Project, Offer } from './validation';
export const projects = cache(async (): Promise<Project[]> => {
  if (!isConfigured()) return initialProjects as Project[];
  const rows: Project[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db()
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error('Project catalog unavailable');
    rows.push(...(data as Project[]));
    if (data.length < 1000) return rows;
  }
});
export const offers = cache(async (): Promise<Offer[]> => {
  if (!isConfigured()) return [];
  const rows: Offer[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db()
      .from('offers')
      .select('*')
      .eq('status', 'published')
      .eq('agreement_confirmed', true)
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error('Offer catalog unavailable');
    rows.push(...(data as Offer[]));
    if (data.length < 1000) return rows;
  }
});

// Weryfikacja skill tokenu — agent OpenClaw woła nasze /api/skills/*
// z Bearer tokenem (`OPENCLAW_SKILL_TOKEN`) + X-Farm-Id header.
//
// Token jest ten sam dla wszystkich agentów AgriClaw (shared sekret),
// ale farm_id jest identyfikatorem konkretnego gospodarstwa — tak samo
// jak w clawlabspro gdzie agent ma tenant_id w metadanych.

import { NextRequest } from 'next/server';

export interface SkillAuthResult {
  ok: boolean;
  farmId: string | null;
  error?: string;
}

export function verifySkillAuth(req: NextRequest): SkillAuthResult {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return { ok: false, farmId: null, error: 'Missing Bearer token' };
  }
  const token = auth.slice(7);
  const expected = process.env.OPENCLAW_SKILL_TOKEN;
  if (!expected) {
    // W dev bez skill tokenu dopuszczamy z X-Dev-Skip (tylko NODE_ENV=development)
    if (process.env.NODE_ENV === 'development' && req.headers.get('x-dev-skip') === '1') {
      const farmId = req.headers.get('x-farm-id');
      return farmId ? { ok: true, farmId } : { ok: false, farmId: null, error: 'Missing X-Farm-Id' };
    }
    return { ok: false, farmId: null, error: 'Skill token not configured' };
  }
  if (token !== expected) {
    return { ok: false, farmId: null, error: 'Invalid skill token' };
  }
  const farmId = req.headers.get('x-farm-id');
  if (!farmId) {
    return { ok: false, farmId: null, error: 'Missing X-Farm-Id header' };
  }
  return { ok: true, farmId };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUsers, createUser, deleteUser } from './userService';
import { prisma } from '@/lib/prisma';
import type { PostUserBody } from '@/types/user';

describe('userService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getAllUsers returns all users for owner', async () => {
    const expected = [{ id: '1', name: 'Owner', email: 'owner@example.com' }];
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue(expected as any);

    const result = await getAllUsers('owner', null);
    expect(result).toEqual(expected);
    expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
  });

  it('getAllUsers returns self organization users for admin', async () => {
    const expected = [{ id: '2', name: 'Admin User', email: 'admin@example.com' }];
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue(expected as any);

    const result = await getAllUsers('admin', 'org-1');
    expect(result).toEqual(expected);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      orderBy: { name: 'asc' },
    });
  });

  it('createUser rejects invalid role', async () => {
    const body = {
      name: 'Test',
      email: 'test@example.com',
      password: 'pass',
      role: 'invalid',
      organizationId: 'org-1',
    } as unknown as PostUserBody;

    const result = await createUser(body, 'owner', null);

    expect(result).toEqual({ error: 'role は owner, admin, editer, viewer のいずれかで指定してください', status: 400 });
  });

  it('createUser rejects duplicate email', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: '1' } as any);

    const result = await createUser(
      { name: 'Test', email: 'test@example.com', password: 'pass', role: 'viewer', organizationId: 'org-1' },
      'owner',
      null
    );

    expect(result).toEqual({ error: '既に登録済みの email です', status: 400 });
  });

  it('deleteUser rejects missing id', async () => {
    const result = await deleteUser({ id: '' }, 'owner', null);
    expect(result).toEqual({ error: 'id は必須です', status: 400 });
  });
});

import { Command } from 'commander';
import * as p from '@clack/prompts';
import { db } from '../../lib/db';
import { organizations, users, members } from '../../lib/db/schema';
import { or, ilike } from 'drizzle-orm';

export const orgCommands = new Command('org')
  .description('Manage organizations and members');

orgCommands
  .command('list')
  .description('List all organizations')
  .action(async () => {
    const orgs = await db.select().from(organizations);
    console.table(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })));
  });

orgCommands
  .command('add-member')
  .description('Add a member to an organization')
  .action(async () => {
    // 1. Select Organization
    const allOrgs = await db.select().from(organizations);
    const orgSelection = await p.select({
      message: 'Select an organization',
      options: allOrgs.map(o => ({ value: o.id, label: o.name })),
    });

    if (p.isCancel(orgSelection)) return;

    // 2. Search User
    const searchTerm = await p.text({
      message: 'Enter user email or name to search',
      placeholder: 'example@email.com',
      validate: (value: string | undefined) => {
        if (!value || value.length < 2) return 'Please enter at least 2 characters';
      },
    });

    if (p.isCancel(searchTerm)) return;

    const foundUsers = await db.select()
      .from(users)
      .where(
        or(
          ilike(users.email, `%${searchTerm}%`),
          ilike(users.name, `%${searchTerm}%`)
        )
      )
      .limit(10);

    if (foundUsers.length === 0) {
      p.note('No users found matching that criteria.');
      return;
    }

    const userSelection = await p.select({
      message: 'Select user',
      options: foundUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` })),
    });

    if (p.isCancel(userSelection)) return;

    // 3. Select Role
    const roleSelection = await p.select({
      message: 'Select role',
      options: [
        { value: 'administrator', label: 'Administrator' },
        { value: 'member', label: 'Member' },
        { value: 'viewer', label: 'Viewer' },
      ],
    });

    if (p.isCancel(roleSelection)) return;

    // 4. Confirm and Execute
    const confirmed = await p.confirm({
      message: `Add user to organization as ${roleSelection}?`,
    });

    if (confirmed && !p.isCancel(confirmed)) {
      const s = p.spinner();
      s.start('Adding member...');
      try {
        await db.insert(members).values({
          id: globalThis.crypto.randomUUID(),
          organizationId: orgSelection as string,
          userId: userSelection as string,
          role: roleSelection as string,
          createdAt: new Date(),
        }).onConflictDoUpdate({
          target: [members.organizationId, members.userId],
          set: { role: roleSelection as string }
        });
        s.stop('✅ Member added/updated successfully');
      } catch (error) {
        s.error('❌ Failed to add member');
        console.error(error);
      }
    }
  });

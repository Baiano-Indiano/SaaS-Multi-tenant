import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local (dev) or .env (prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { Command } from 'commander';
import * as p from '@clack/prompts';
import { tenantCommands } from '@/cli/commands/tenant';
import { orgCommands } from '@/cli/commands/org';

const program = new Command();

program
  .name('saas-cli')
  .description('Internal CLI for SaaS Multi-tenant management')
  .version('0.1.0');

// Register Commands
program.addCommand(tenantCommands);
program.addCommand(orgCommands);

// Interactive mode if no arguments provided
async function interactiveMode() {
  p.intro('🚀 SaaS Multi-tenant CLI');
  
  const action = await p.select({
    message: 'What would you like to manage?',
    options: [
      { value: 'tenant', label: 'Tenants (Schemas & Migrations)' },
      { value: 'org', label: 'Organizations & Members' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (action === 'exit' || p.isCancel(action)) {
    p.outro('Goodbye!');
    process.exit(0);
  }

  if (action === 'tenant') {
    // Navigate to tenant sub-prompts or run specific command
    const tenantAction = await p.select({
      message: 'Tenant Management',
      options: [
        { value: 'list', label: 'List all tenants' },
        { value: 'migrate', label: 'Run migrations for all tenants' },
        { value: 'back', label: '← Back' },
      ],
    });

    if (tenantAction === 'back' || p.isCancel(tenantAction)) {
      return interactiveMode();
    }

    // Execute logic directly for now or call command functions
    // (In a real app, we'd route this properly)
    if (tenantAction === 'list') {
      await program.parseAsync(['node', 'saas-cli', 'tenant', 'list']);
    } else if (tenantAction === 'migrate') {
      await program.parseAsync(['node', 'saas-cli', 'tenant', 'migrate']);
    }
  }

  if (action === 'org') {
    const orgAction = await p.select({
      message: 'Organization Management',
      options: [
        { value: 'list', label: 'List all organizations' },
        { value: 'add-member', label: 'Add member to organization' },
        { value: 'back', label: '← Back' },
      ],
    });

    if (orgAction === 'back' || p.isCancel(orgAction)) {
      return interactiveMode();
    }

    if (orgAction === 'list') {
      await program.parseAsync(['node', 'saas-cli', 'org', 'list']);
    } else if (orgAction === 'add-member') {
      await program.parseAsync(['node', 'saas-cli', 'org', 'add-member']);
    }
  }

  p.outro('Operation complete.');
}

if (process.argv.length <= 2) {
  interactiveMode().catch(console.error);
} else {
  program.parseAsync(process.argv).catch(console.error);
}

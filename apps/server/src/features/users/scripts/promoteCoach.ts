/**
 * DEV ONLY: promote an existing user to role=coach, so coach mode and the coach
 * dashboard can be tested before the Phase 3 seed exists.
 *
 *   npm run promote:coach -- <email>                  (local database)
 *   npm run promote:coach -- <email> --allow-remote   (non-local dev database)
 *
 * Refuses to run when NODE_ENV=production. Refuses a non-local database unless
 * --allow-remote is passed, and always prints which database it is about to touch.
 */
import mongoose from 'mongoose';
import { config } from '../../../config/env';
import { connectDatabase } from '../../../config/database';
import { User } from '../user.model';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

interface DatabaseTarget {
  hosts: string[];
  databaseName: string;
  isLocal: boolean;
}

// Parses host list and db name from a MongoDB URL without ever printing credentials.
export function describeDatabaseUrl(databaseUrl: string): DatabaseTarget {
  const withoutScheme = databaseUrl.replace(/^mongodb(\+srv)?:\/\//, '');
  const withoutCredentials = withoutScheme.includes('@')
    ? withoutScheme.slice(withoutScheme.lastIndexOf('@') + 1)
    : withoutScheme;
  const [hostPart, pathPart = ''] = withoutCredentials.split('/');
  const hosts = hostPart.split(',').map((host) => host.replace(/:\d+$/, ''));
  const databaseName = pathPart.split('?')[0] || '(default)';
  const isLocal = !databaseUrl.startsWith('mongodb+srv://') && hosts.every((host) => LOCAL_HOSTS.has(host));
  return { hosts, databaseName, isLocal };
}

async function main() {
  const args = process.argv.slice(2);
  const allowRemote = args.includes('--allow-remote');
  const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: npm run promote:coach -- <email> [--allow-remote]');
    process.exit(1);
  }

  if (config.nodeEnv === 'production') {
    console.error('Refusing to run: NODE_ENV is "production". This script is for development only.');
    process.exit(1);
  }

  if (!config.databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const target = describeDatabaseUrl(config.databaseUrl);
  console.log(`Database: ${target.hosts.join(', ')} / ${target.databaseName}`);

  if (!target.isLocal) {
    if (!allowRemote) {
      console.error(
        'Refusing to run: DATABASE_URL points to a non-local database.\n' +
          'If this is really your DEV database, re-run with --allow-remote.',
      );
      process.exit(1);
    }
    console.warn('WARNING: --allow-remote given — writing to a NON-LOCAL database. Never use this on production.');
  }

  await connectDatabase();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`No user with email ${email}.`);
      process.exitCode = 1;
      return;
    }
    if (user.role === 'coach') {
      console.log(`${email} is already a coach. Nothing changed.`);
      return;
    }
    user.role = 'coach';
    await user.save();
    console.log(`${email} is now a coach.`);
  } finally {
    await mongoose.disconnect();
  }
}

// Only run when executed directly, so tests can import describeDatabaseUrl.
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

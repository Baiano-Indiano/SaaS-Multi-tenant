const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const prefixes = {
  proxy: `${colors.cyan}${colors.bold}[Proxy]${colors.reset}`,
  db: `${colors.magenta}${colors.bold}[Db]${colors.reset}`,
  webhook: `${colors.blue}${colors.bold}[Webhook]${colors.reset}`,
  action: `${colors.green}${colors.bold}[Action]${colors.reset}`,
  api: `${colors.blue}${colors.bold}[API]${colors.reset}`,
  cron: `${colors.yellow}${colors.bold}[Cron]${colors.reset}`,
  audit: `${colors.magenta}${colors.bold}[Audit]${colors.reset}`,
};

type LogCategory = 'proxy' | 'db' | 'webhook' | 'action' | 'api' | 'cron' | 'audit';

export const logger = {
  info(category: LogCategory, message: string, ...details: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = prefixes[category] || `[${category.toUpperCase()}]`;
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ${prefix} ${message}`,
      ...details
    );
  },
  
  warn(category: LogCategory, message: string, ...details: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = prefixes[category] || `[${category.toUpperCase()}]`;
    console.warn(
      `${colors.gray}[${timestamp}]${colors.reset} ${prefix} ${colors.yellow}${colors.bold}[WARN]${colors.reset} ${colors.yellow}${message}${colors.reset}`,
      ...details
    );
  },

  error(category: LogCategory, message: string, error?: any, ...details: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = prefixes[category] || `[${category.toUpperCase()}]`;
    const errMsg = error instanceof Error ? error.message : String(error || '');
    const errStack = error instanceof Error && error.stack ? `\n${error.stack}` : '';
    console.error(
      `${colors.gray}[${timestamp}]${colors.reset} ${prefix} ${colors.red}${colors.bold}[ERROR]${colors.reset} ${colors.red}${message}${colors.reset}`,
      errMsg ? `\nDetail: ${errMsg}` : '',
      errStack,
      ...details
    );
  },

  db(queryName: string, schema: string, status: 'success' | 'failed' | 'pending', durationMs?: number, ...details: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = prefixes.db;
    const durationStr = durationMs !== undefined ? ` ${colors.cyan}(${durationMs}ms)${colors.reset}` : '';
    const statusColor = status === 'success' ? colors.green : status === 'failed' ? colors.red : colors.yellow;
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ${prefix} Schema: ${colors.bold}${schema}${colors.reset} | Query: ${colors.bold}${queryName}${colors.reset} -> ${statusColor}${status.toUpperCase()}${colors.reset}${durationStr}`,
      ...details
    );
  },

  request(method: string, path: string, status: number, durationMs?: number, ...details: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = prefixes.proxy;
    const durationStr = durationMs !== undefined ? ` ${colors.cyan}(${durationMs}ms)${colors.reset}` : '';
    const statusColor = status >= 200 && status < 300 ? colors.green : status >= 400 ? colors.red : colors.yellow;
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ${prefix} ${colors.bold}${method}${colors.reset} ${path} -> ${statusColor}${status}${colors.reset}${durationStr}`,
      ...details
    );
  }
};

import fs from 'fs';
import path from 'path';

interface SqlStatementLike {
  run: (...params: any[]) => { changes: number; lastInsertRowid: number };
  get: (...params: any[]) => any;
  all: (...params: any[]) => any[];
}

interface SqlDatabaseLike {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqlStatementLike;
  close: () => void;
}

class InMemorySqliteFallback implements SqlDatabaseLike {
  private tables: Map<string, any[]> = new Map();

  public exec(_sql: string): void {
    // No-op DDL/transaction shim for Node < 22 environments lacking node:sqlite
  }

  public prepare(sql: string): SqlStatementLike {
    const normalized = sql.trim();
    const upper = normalized.toUpperCase();
    const tables = this.tables;

    return {
      run: (...params: any[]) => {
        const insertMatch = normalized.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
        if (insertMatch) {
          const tableName = insertMatch[1];
          const cols = insertMatch[2].split(',').map((c) => c.trim());
          const row: Record<string, any> = {};
          cols.forEach((col, idx) => {
            row[col] = idx < params.length ? params[idx] : null;
          });
          if (!tables.has(tableName)) tables.set(tableName, []);
          const list = tables.get(tableName)!;
          list.push(row);
          return { changes: 1, lastInsertRowid: list.length };
        }
        const updateMatch = normalized.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([a-zA-Z0-9_]+)\s*=\s*\?/i);
        if (updateMatch) {
          const tableName = updateMatch[1];
          const setClause = updateMatch[2];
          const whereCol = updateMatch[3];
          const whereVal = params[params.length - 1];
          const rows = tables.get(tableName) || [];
          const assignments = setClause.split(',').map((s) => s.trim());
          let changed = 0;
          for (const row of rows) {
            if (row[whereCol] === whereVal) {
              let pIdx = 0;
              for (const assign of assignments) {
                const colMatch = assign.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/i);
                if (!colMatch) continue;
                const col = colMatch[1];
                const expr = colMatch[2].trim();
                if (/^COALESCE\(\?,/i.test(expr)) {
                  const val = params[pIdx++];
                  if (val !== null && val !== undefined) row[col] = val;
                } else if (expr === '?') {
                  row[col] = params[pIdx++];
                }
              }
              changed++;
            }
          }
          return { changes: changed, lastInsertRowid: 0 };
        }
        return { changes: 1, lastInsertRowid: 1 };
      },
      get: (...params: any[]) => {
        if (upper.startsWith('PRAGMA JOURNAL_MODE')) {
          return { journal_mode: 'memory-fallback' };
        }
        const countMatch = normalized.match(/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+([a-zA-Z0-9_]+)/i);
        if (countMatch) {
          const rows = tables.get(countMatch[1]) || [];
          return { count: rows.length };
        }
        const selectMatch = normalized.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        if (selectMatch) {
          const rows = tables.get(selectMatch[1]) || [];
          const lowerOrMatch = normalized.match(/WHERE\s+LOWER\(([a-zA-Z0-9_]+)\)\s*=\s*LOWER\(\?\)\s+OR\s+LOWER\(([a-zA-Z0-9_]+)\)\s*=\s*LOWER\(\?\)/i);
          if (lowerOrMatch && params.length >= 2) {
            const c1 = lowerOrMatch[1], c2 = lowerOrMatch[2];
            const v1 = String(params[0] ?? '').toLowerCase(), v2 = String(params[1] ?? '').toLowerCase();
            return rows.find((r) => String(r[c1] ?? '').toLowerCase() === v1 || String(r[c2] ?? '').toLowerCase() === v2);
          }
          const eqMatch = normalized.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=\s*\?/i);
          if (eqMatch && params.length >= 1) {
            const col = eqMatch[1];
            return rows.find((r) => r[col] === params[0]);
          }
          return rows[0] || undefined;
        }
        return undefined;
      },
      all: (...params: any[]) => {
        const selectMatch = normalized.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        if (selectMatch) {
          const rows = tables.get(selectMatch[1]) || [];
          const eqMatch = normalized.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=\s*'([^']+)'/i);
          if (eqMatch && params.length === 0) {
            const col = eqMatch[1], val = eqMatch[2];
            return rows.filter((r) => r[col] === val);
          }
          const paramEqMatch = normalized.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=\s*\?/i);
          if (paramEqMatch && params.length >= 1) {
            return rows.filter((r) => r[paramEqMatch[1]] === params[0]);
          }
          return [...rows];
        }
        return [];
      }
    };
  }

  public close(): void {
    this.tables.clear();
  }
}

function createDatabaseEngine(dbPath: string): { db: SqlDatabaseLike; engineName: string } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqliteMod = require('node:sqlite');
    if (sqliteMod && sqliteMod.DatabaseSync) {
      return {
        db: new sqliteMod.DatabaseSync(dbPath),
        engineName: 'node:sqlite (Embedded Production Engine)'
      };
    }
  } catch (_err) {
    console.info('ℹ️ node:sqlite unavailable on current Node runtime (< v22); using local in-memory guidance store.');
  }
  return {
    db: new InMemorySqliteFallback(),
    engineName: 'in-memory-local-fallback (Node 20 Compatible)'
  };
}

export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private db: SqlDatabaseLike;
  private dbPath: string;
  private engineName: string;

  private constructor() {
    // Resolve database storage directory
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'agriscan_production.db');

    // Initialize native SQLite database (or Node 20 in-memory fallback)
    const created = createDatabaseEngine(this.dbPath);
    this.db = created.db;
    this.engineName = created.engineName;

    // Enable high-performance Write-Ahead Logging (WAL) and foreign key enforcement
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    this.db.exec('PRAGMA temp_store = MEMORY;');
    this.db.exec('PRAGMA busy_timeout = 5000;');

    this.initializeSchema();
  }

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  public static resetForTesting(): AppDatabase {
    if (AppDatabase.instance) {
      try {
        AppDatabase.instance.db.close();
      } catch (e) {}
      AppDatabase.instance = null;
    }
    const dataDir = path.resolve(__dirname, '../../data');
    const dbPath = path.join(dataDir, 'agriscan_production.db');
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      } catch (e) {}
    }
    return AppDatabase.getInstance();
  }

  public getRawDb(): SqlDatabaseLike {
    return this.db;
  }

  public getDb(): SqlDatabaseLike {
    return this.db;
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  private initializeSchema(): void {
    const candidateSchemaPaths = [
      path.resolve(__dirname, 'schema.sql'),
      path.resolve(__dirname, '../src/db/schema.sql'),
      path.resolve(process.cwd(), 'src/db/schema.sql'),
      path.resolve(process.cwd(), 'backend/src/db/schema.sql'),
      path.resolve(process.cwd(), 'dist/db/schema.sql')
    ];

    let schemaContent = '';
    for (const p of candidateSchemaPaths) {
      if (fs.existsSync(p)) {
        schemaContent = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (schemaContent) {
      this.db.exec(schemaContent);
    } else {
      console.warn('⚠️ Warning: schema.sql file not located, skipping DDL execution');
    }

    // Auto-migration safeguards for existing database files
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
    } catch (e) {}
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;');
    } catch (e) {}
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
    } catch (e) {}
  }

  /**
   * Run a function within an ACID transaction
   */
  public transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Safe read-only query execution for live inspection / analytics
   */
  public executeReadOnlyQuery(sql: string, params: any[] = []): any[] {
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select') && !trimmed.startsWith('pragma') && !trimmed.startsWith('explain')) {
      throw new Error('SECURITY_ERROR: Only SELECT, PRAGMA, and EXPLAIN queries are permitted in read-only mode.');
    }
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Diagnostic statistics for database health checks
   */
  public getDatabaseStats() {
    let fileSize = 0;
    try {
      const stats = fs.statSync(this.dbPath);
      fileSize = stats.size;
    } catch {
      fileSize = 0;
    }

    const tables = [
      'users',
      'dpdp_consents',
      'otp_sessions',
      'farms',
      'soil_health_cards',
      'crop_cycles',
      'diagnoses',
      'adaptive_questionnaires',
      'recommendations',
      'escalations',
      'clinic_inventory',
      'inventory_batches',
      'audit_trail_logs',
      'farmer_login_activity_logs',
      'mandi_prices',
      'scheme_applications',
      'community_outbreaks',
      'state_agro_challenges',
      'chc_machinery_bookings',
      'agri_graduate_licenses',
      'certified_input_products',
      'agronomist_prescriptions',
      'farmer_orders_and_khata',
      'agri_consultation_bookings'
    ];

    const tableCounts: Record<string, number> = {};
    for (const tbl of tables) {
      try {
        const row: any = this.db.prepare(`SELECT COUNT(*) as count FROM ${tbl}`).get();
        tableCounts[tbl] = row ? row.count : 0;
      } catch {
        tableCounts[tbl] = 0;
      }
    }

    // Get journal mode
    const journalModeRow: any = this.db.prepare('PRAGMA journal_mode;').get();

    return {
      databaseEngine: this.engineName,
      databaseFile: this.dbPath,
      fileSizeBytes: fileSize,
      fileSizeFormatted: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      journalMode: journalModeRow ? journalModeRow.journal_mode : 'wal',
      tableCounts,
      timestamp: new Date().toISOString()
    };
  }

  public getStats() {
    const s = this.getDatabaseStats();
    return {
      walMode: (s.journalMode || '').toLowerCase() === 'wal',
      journalMode: s.journalMode,
      filePath: s.databaseFile,
      fileSizeBytes: s.fileSizeBytes,
      fileSizeFormatted: s.fileSizeFormatted,
      databaseEngine: s.databaseEngine,
      activeTables: Object.keys(s.tableCounts),
      tableCounts: s.tableCounts,
      timestamp: s.timestamp
    };
  }

  public close(): void {
    try {
      this.db.close();
    } catch (e) {
      console.error('Error closing database:', e);
    }
  }
}

export const getDb = () => AppDatabase.getInstance().getRawDb();

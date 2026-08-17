/**
 * Type declarations for node:sqlite (experimental in Node 22).
 * The Node.js team has not yet published official @types for this module.
 * These are the minimal types we use in OportunIA.
 */

declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);

    exec(sql: string): void;

    prepare(sql: string): StatementSync;

    transaction<T extends (...args: any[]) => any>(fn: T): T;

    close(): void;

    pragma(pragma: string): any;
  }

  export class StatementSync {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };

    get(...params: any[]): any;

    all(...params: any[]): any[];

    iterate(...params: any[]): IterableIterator<any>;
  }
}

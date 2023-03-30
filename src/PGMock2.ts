import crypto from 'crypto';
import { QueryConfig, QueryResult } from 'pg';
import { IPGClient, IPGMockData, MockQueryResult } from './interfaces';

/**
 * An NPM module for mocking a connection to a PostgreSQL database.
 * @author Jason Favrod <mail@jasonfavrod.com>
 * @example
 * ```
 * const PGMock2 = require('pgmock2'),
 * const pgmock = new PGMock2();
 * ```
 */
export default class PGMock2 {
    private data = {} as IPGMockData;
    private latency = 20;

    /**
     * Add a query, it's value definitions, and response to the
     * mock database.
     * @param {string} query An SQL query statement.
     * @param {object} response The simulated expected response of
     * the given query.
     * @example
     * ```
     * pgmock.add("SELECT * FROM employees WHERE id = $1", {
     *     rowCount: 1,
     *     rows: [
     *         { id: 1, name: 'John Smith', position: 'application developer' }
     *     ]
     * });
     * ```
     */
    public add(query: string, response: MockQueryResult) {
        this.data[this.normalize(query)] = {
            query,
            response,
        };
    }

    /**
     * Get a simulated pg.Client or pg.Pool connection.
     * @namespace connect
     * @example const conn = pgmock.connect();
     */
    public async connect(): Promise<IPGClient> {
        const connection: IPGClient = {
            /**
             * Simulate ending a pg connection.
             * @memberof connect
             * @example conn.release();
             */
            end: () =>  new Promise((res) => res()),

            /**
             * Query the mock database.
             * @memberof connect
             * @param {string} sql An SQL statement.
             * @example conn.query('select * from employees where id=$1;')
             * .then(data => console.log(data))
             * .catch(err => console.log(err.message));
             * @example {
             *   rowCount: 1,
             *   rows: [
             *       { id: 1, name: 'John Smith', position: 'application developer' }
             *   ]
             * }
             */
            query: (queryTextOrConfig: string | QueryConfig): Promise<QueryResult> => (
                this.query(queryTextOrConfig)
            ),

            /**
             * Simulate releasing a pg connection.
             * @memberof connect
             * @example conn.release();
             */
            release: () => new Promise((res) => res()),
        };

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(connection);
            }, this.latency);
        });
    }

    /**
     * Remove a query from the mock database.
     * @param {string} query An SQL statement added with the add method.
     * @returns {boolean} true if removal successful, false otherwise.
     */
    public drop(query: string): boolean {
        return delete this.data[this.normalize(query)];
    }

    /**
     * Flushes the mock database.
     */
    public dropAll(): void {
        this.data = {} as IPGMockData;
    }

    public end() { return new Promise((res) => res(null)); }

    public query(queryTextOrConfig: string | QueryConfig): Promise<QueryResult> {
        if (typeof queryTextOrConfig === 'object') {
            return this.performQuery(queryTextOrConfig.text);
        }
        return this.performQuery(queryTextOrConfig);
    }

    /**
     * Set the simulated network latency (default 20 ms).
     */
    public setLatency(latency: number): void {
        this.latency = latency;
    }

    /**
     * Return a string representation of the mock database.
     * @example
     * ```
     * {
     *     "3141ffa79e40392187830c52d0588f33": {
     *         "query": "SELECT * FROM it.projects",
     *         "response": {
     *             "rowCount": 3,
     *             "rows": [
     *                 {
     *                     "title": "Test Project 0",
     *                     "status": "pending",
     *                     "priority": "low",
     *                     "owner": "Favrod, Jason"
     *                 },
     *                 {
     *                     "title": "Test Project 1",
     *                     "status": "pending",
     *                     "priority": "low",
     *                     "owner": "Favrod, Jason"
     *                 },
     *             ]
     *         }
     *     },
     *     "81c4b35dfd07db7dff2cb0e91228e833": {
     *         "query": "SELECT * FROM it.projects WHERE title = $1",
     *         "response": {
     *             "rowCount": 1,
     *             "rows": [
     *                 {
     *                     "title": "Test Project 0",
     *                     "status": "pending",
     *                     "priority": "low",
     *                     "owner": "Favrod, Jason"
     *                 }
     *             ]
     *         }
     *     }
     * }
     * ```
     */
    public toString() {
        return JSON.stringify(this.data, null, 2);
    }

    // Return the rawQuery in lowercase, without spaces nor
    // a trailing semicolon.
    private normalize(rawQuery: string): string {
        const norm = rawQuery.toLowerCase().replace(/\s/g, "").replace(/;$/, "");
        const hash = crypto.createHash("md5");
        hash.update(norm);

        return hash.digest().toString("hex");
    }

    private performQuery(sql: string): Promise<QueryResult> {
        const norm = this.normalize(sql);
        const validQuery = this.data[norm];

        return new Promise((resolve, reject) => {
            if (validQuery) {
                setTimeout(() => {
                    resolve(validQuery.response as QueryResult);
                }, this.latency);
            } else {
                setTimeout(() => {
                    reject(new Error('invalid query: ' + sql + ' query hash: ' + norm));
                }, this.latency);
            }
        });
    }
}

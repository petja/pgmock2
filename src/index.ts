import { Client, Pool } from 'pg';
import PGMock from './PGMock';

export default PGMock;

export const getClient = (pgmock?: PGMock): Client => {
    pgmock = pgmock || new PGMock();
    return pgmock as unknown as Client;
};

export const getPool = (pgmock?: PGMock): Pool => {
    pgmock = pgmock || new PGMock();
    return pgmock as unknown as Pool;
};

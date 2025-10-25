import request from 'supertest';
import app from '../src/app';
import pool from '../src/utils/database';
import axios from 'axios';
import fs from 'fs';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Countries API', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    console.log('Setting up test database...');
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS countries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          capital VARCHAR(255),
          region VARCHAR(255),
          population BIGINT NOT NULL,
          currency_code VARCHAR(10),
          exchange_rate DECIMAL(20, 10),
          estimated_gdp DECIMAL(30, 10),
          flag_url VARCHAR(255),
          last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS app_status (
          id INT PRIMARY KEY,
          last_refreshed_at TIMESTAMP
        );
      `);
      await connection.query('INSERT INTO app_status (id, last_refreshed_at) VALUES (1, NULL)');
      console.log('Test database setup complete.');
    } catch (error) {
      console.error('Error setting up test database:', error);
    } finally {
      connection.release();
    }
  });

  afterAll(async () => {
    console.log('Tearing down test database...');
    const connection = await pool.getConnection();
    try {
      await connection.query('DROP TABLE IF EXISTS countries');
      await connection.query('DROP TABLE IF EXISTS app_status');
    } catch (error) {
      console.error('Error tearing down test database:', error);
    } finally {
      connection.release();
      await pool.end();
      console.log('Test database teardown complete.');
    }
  });

  beforeEach(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('TRUNCATE TABLE countries');
      await connection.query('TRUNCATE TABLE app_status');
      await connection.query('INSERT INTO app_status (id, last_refreshed_at) VALUES (1, NULL)');

      if (fs.existsSync('cache/summary.png')) {
        fs.unlinkSync('cache/summary.png');
      }
    } catch (error) {
      console.error('Error in beforeEach hook:', error);
    } finally {
      connection.release();
    }
  });

  describe('POST /countries/refresh', () => {
    it('should fetch and store countries and return 200 OK', async () => {
      const countriesData = [
        { name: 'Nigeria', capital: 'Abuja', region: 'Africa', population: 206139589, flag: 'ng.svg', currencies: [{ code: 'NGN' }] },
        { name: 'United States', capital: 'Washington, D.C.', region: 'Americas', population: 329484123, flag: 'us.svg', currencies: [{ code: 'USD' }] },
      ];
      const exchangeRatesData = { rates: { NGN: 1600, USD: 1 } };

      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('restcountries')) {
          return Promise.resolve({ data: countriesData });
        }
        if (url.includes('open.er-api')) {
          return Promise.resolve({ data: exchangeRatesData });
        }
        return Promise.reject(new Error('not found'));
      });

      const response = await request(app).post('/countries/refresh');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Countries refreshed successfully');

      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT * FROM countries');
      expect(rows).toHaveLength(2);
      connection.release();
    });

    it('should return 503 if countries API fails', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('restcountries')) {
          return Promise.reject(new Error('API is down'));
        }
        if (url.includes('open.er-api')) {
          return Promise.resolve({ data: { rates: { USD: 1 } } });
        }
        return Promise.reject(new Error('not found'));
      });

      const response = await request(app).post('/countries/refresh');

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('External data source unavailable');
    });
  });

  describe('GET /countries', () => {
    it('should return all countries', async () => {
      const connection = await pool.getConnection();
      await connection.query("INSERT INTO countries (name, population, currency_code) VALUES ('Nigeria', 200, 'NGN'), ('Ghana', 100, 'GHS')");
      connection.release();

      const response = await request(app).get('/countries');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should filter by region', async () => {
      const connection = await pool.getConnection();
      await connection.query("INSERT INTO countries (name, region, population, currency_code) VALUES ('Nigeria', 'Africa', 200, 'NGN'), ('Germany', 'Europe', 80, 'EUR')");
      connection.release();

      const response = await request(app).get('/countries?region=Africa');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Nigeria');
    });
  });

  describe('GET /countries/:name', () => {
    it('should return a single country', async () => {
      const connection = await pool.getConnection();
      await connection.query("INSERT INTO countries (name, population, currency_code) VALUES ('Nigeria', 200, 'NGN')");
      connection.release();

      const response = await request(app).get('/countries/Nigeria');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Nigeria');
    });

    it('should return 404 for a non-existent country', async () => {
      const response = await request(app).get('/countries/NonExistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Country not found');
    });
  });

  describe('DELETE /countries/:name', () => {
    it('should delete a country', async () => {
      const connection = await pool.getConnection();
      await connection.query("INSERT INTO countries (name, population, currency_code) VALUES ('Nigeria', 200, 'NGN')");
      connection.release();

      const response = await request(app).delete('/countries/Nigeria');

      expect(response.status).toBe(204);

      const [rows] = await connection.query('SELECT * FROM countries WHERE name = ?', ['Nigeria']);
      expect(rows).toHaveLength(0);
    });
  });

  describe('GET /status', () => {
    it('should return the status', async () => {
      const connection = await pool.getConnection();
      await connection.query("INSERT INTO countries (name, population, currency_code) VALUES ('Nigeria', 200, 'NGN')");
      await connection.query("UPDATE app_status SET last_refreshed_at = '2025-10-26 10:00:00' WHERE id = 1");
      connection.release();

      const response = await request(app).get('/status');

      expect(response.status).toBe(200);
      expect(response.body.total_countries).toBe(1);
      expect(new Date(response.body.last_refreshed_at).getTime()).toBe(new Date('2025-10-26 10:00:00').getTime());
    });
  });

  describe('GET /countries/image', () => {
    it('should return 404 if image does not exist', async () => {
      const response = await request(app).get('/countries/image');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Summary image not found');
    });
  });
});
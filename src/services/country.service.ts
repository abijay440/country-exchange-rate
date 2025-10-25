import pool from '../utils/database';
import { Country } from '../models/country.model';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';

const COUNTRIES_API_URL = 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

export const refreshCountries = async (): Promise<void> => {
  try {
    const [countriesResponse, exchangeRatesResponse] = await Promise.all([
      axios.get(COUNTRIES_API_URL),
      axios.get(EXCHANGE_RATE_API_URL)
    ]);

    const countries = countriesResponse.data;
    const rates = exchangeRatesResponse.data.rates;

    const countryPromises = countries.map(async (countryData: any) => {
      const currencyCode = countryData.currencies?.[0]?.code;
      const exchangeRate = currencyCode ? rates[currencyCode] : null;
      const estimatedGdp = (countryData.population * (Math.random() * (2000 - 1000) + 1000)) / (exchangeRate || 1);

      const country: Country = {
        name: countryData.name,
        capital: countryData.capital,
        region: countryData.region,
        population: countryData.population,
        currency_code: currencyCode || null,
        exchange_rate: exchangeRate || null,
        estimated_gdp: exchangeRate ? estimatedGdp : null,
        flag_url: countryData.flag,
      };

      await upsertCountry(country);
    });

    await Promise.all(countryPromises);
    await updateLastRefreshedAt();
    await generateSummaryImage();

  } catch (error) {
    console.error('Error refreshing countries:', error);
    throw new Error('External data source unavailable');
  }
};

const upsertCountry = async (country: Country) => {
  const connection = await pool.getConnection();
  try {
    const [rows]: any = await connection.query('SELECT id FROM countries WHERE name = ?', [country.name]);
    if (rows.length > 0) {
      await connection.query('UPDATE countries SET ? WHERE id = ?', [country, rows[0].id]);
    } else {
      await connection.query('INSERT INTO countries SET ?', [country]);
    }
  } finally {
    connection.release();
  }
};

const updateLastRefreshedAt = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query('UPDATE app_status SET last_refreshed_at = NOW() WHERE id = 1');
  } finally {
    connection.release();
  }
};

export const getCountries = async (filters: any): Promise<Country[]> => {
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT * FROM countries';
    const queryParams: any[] = [];

    if (filters.region) {
      query += ' WHERE region = ?';
      queryParams.push(filters.region);
    }

    if (filters.currency) {
      if (queryParams.length > 0) {
        query += ' AND currency_code = ?';
      } else {
        query += ' WHERE currency_code = ?';
      }
      queryParams.push(filters.currency);
    }

    if (filters.sort === 'gdp_desc') {
      query += ' ORDER BY estimated_gdp DESC';
    }

    const [rows] = await connection.query(query, queryParams);
    return rows as Country[];
  } finally {
    connection.release();
  }
};

export const getCountryByName = async (name: string): Promise<Country | null> => {
  const connection = await pool.getConnection();
  try {
    const [rows]: any = await connection.query('SELECT * FROM countries WHERE name = ?', [name]);
    if (rows.length > 0) {
      return rows[0] as Country;
    }
    return null;
  } finally {
    connection.release();
  }
};

export const deleteCountryByName = async (name: string): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.query('DELETE FROM countries WHERE name = ?', [name]);
  } finally {
    connection.release();
  }
};

export const getStatus = async (): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    const [[status]]: any = await connection.query('SELECT last_refreshed_at FROM app_status WHERE id = 1');
    const [[{ total_countries }]]: any = await connection.query('SELECT COUNT(*) as total_countries FROM countries');

    return {
      total_countries,
      last_refreshed_at: status.last_refreshed_at
    };
  } finally {
    connection.release();
  }
};



export const generateSummaryImage = async (): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const [topCountries] = await connection.query('SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5');
    const [[{ total_countries }]]: any = await connection.query('SELECT COUNT(*) as total_countries FROM countries');
    const [[status]]: any = await connection.query('SELECT last_refreshed_at FROM app_status WHERE id = 1');

    const image = sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    const text = `
      <svg width="800" height="600">
        <style>
          .title { fill: #333; font-size: 40px; font-weight: bold; font-family: sans-serif; }
          .stat { fill: #555; font-size: 20px; font-family: sans-serif; }
          .country { fill: #777; font-size: 18px; font-family: sans-serif; }
        </style>
        <text x="50" y="80" class="title">Country Exchange Rate Summary</text>
        <text x="50" y="140" class="stat">Total Countries: ${total_countries}</text>
        <text x="50" y="180" class="stat">Last Refreshed: ${new Date(status.last_refreshed_at).toLocaleString()}</text>
        <text x="50" y="240" class="stat">Top 5 Countries by Estimated GDP:</text>
        ${(topCountries as any).map((country: any, index: number) => `
          <text x="70" y="${280 + index * 30}" class="country">${index + 1}. ${country.name} - ${country.estimated_gdp.toLocaleString()}</text>
        `).join('')}
      </svg>
    `;

    const buffer = Buffer.from(text);
    image.composite([{ input: buffer, top: 0, left: 0 }]);

    if (!fs.existsSync('cache')) {
      fs.mkdirSync('cache');
    }

    await image.toFile('cache/summary.png');

  } finally {
    connection.release();
  }
};

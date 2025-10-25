import { Request, Response } from 'express';
import fs from 'fs';
import * as countryService from '../services/country.service';

export const refreshCountries = async (req: Request, res: Response) => {
  try {
    await countryService.refreshCountries();
    res.status(200).json({ message: 'Countries refreshed successfully' });
  } catch (error: any) {
    res.status(503).json({ error: 'External data source unavailable', details: error.message });
  }
};

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await countryService.getCountries(req.query);
    res.status(200).json(countries);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCountryByName = async (req: Request, res: Response) => {
  try {
    const country = await countryService.getCountryByName(req.params.name);
    if (country) {
      res.status(200).json(country);
    } else {
      res.status(404).json({ error: 'Country not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCountryByName = async (req: Request, res: Response) => {
  try {
    await countryService.deleteCountryByName(req.params.name);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const status = await countryService.getStatus();
    res.status(200).json(status);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const getSummaryImage = async (req: Request, res: Response) => {
  const imagePath = 'cache/summary.png';
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath, { root: '.' });
  } else {
    res.status(404).json({ error: 'Summary image not found' });
  }
};

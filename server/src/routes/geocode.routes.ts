import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'MedRepTerritoryPlanner/1.0';

// Rate limiting for Nominatim (1 request per second)
let lastNominatimCall = 0;
async function rateLimitNominatim() {
  const now = Date.now();
  const diff = now - lastNominatimCall;
  if (diff < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - diff));
  }
  lastNominatimCall = Date.now();
}

// POST /api/geocode — Address to coordinates
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.body;
    if (!address) throw new AppError('Address is required', 400);

    await rateLimitNominatim();

    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new AppError('Geocoding service error', 502);
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      type: string;
    }>;

    const data = results.map((r) => ({
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      displayName: r.display_name,
      type: r.type,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST /api/geocode/reverse — Coordinates to address
router.post('/reverse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    await rateLimitNominatim();

    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) throw new AppError('Reverse geocoding error', 502);

    const result = (await response.json()) as { display_name: string; address: Record<string, string> };

    res.json({
      success: true,
      data: {
        displayName: result.display_name,
        address: result.address,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/geocode/route — Get driving route via OSRM
router.post('/route', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { waypoints } = req.body; // Array of { latitude, longitude }
    if (!waypoints || waypoints.length < 2) {
      throw new AppError('At least 2 waypoints required', 400);
    }

    const coords = waypoints.map((w: any) => `${w.longitude},${w.latitude}`).join(';');
    const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);
    if (!response.ok) throw new AppError('Routing service error', 502);

    const result = (await response.json()) as any;

    if (result.code !== 'Ok') {
      throw new AppError(`Routing error: ${result.message || result.code}`, 502);
    }

    const route = result.routes[0];
    res.json({
      success: true,
      data: {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        legs: route.legs.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          summary: leg.summary,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/geocode/optimize — Optimize waypoint order via OSRM Trip
router.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { waypoints, roundtrip = false } = req.body;
    if (!waypoints || waypoints.length < 2) {
      throw new AppError('At least 2 waypoints required', 400);
    }

    const coords = waypoints.map((w: any) => `${w.longitude},${w.latitude}`).join(';');
    const url = `${OSRM_BASE}/trip/v1/driving/${coords}?overview=full&geometries=geojson&roundtrip=${roundtrip}&source=first`;

    const response = await fetch(url);
    if (!response.ok) throw new AppError('Route optimization error', 502);

    const result = (await response.json()) as any;

    if (result.code !== 'Ok') {
      throw new AppError(`Optimization error: ${result.message || result.code}`, 502);
    }

    const trip = result.trips[0];
    const optimizedOrder = result.waypoints
      .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
      .map((w: any) => w.waypoint_index);

    res.json({
      success: true,
      data: {
        distance: trip.distance,
        duration: trip.duration,
        geometry: trip.geometry,
        optimizedOrder,
        legs: trip.legs.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

/**
 * Geofence utility — reverse geocodes coordinates to find matching
 * state/city/village/ward from Appwrite location collections.
 * 
 * Uses Nominatim (OpenStreetMap) free API for reverse geocoding,
 * then matches results against stored Appwrite location records.
 */
import { serverDatabases, DB_ID } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

interface LocationResult {
    stateId: string | null;
    cityId: string | null;
    villageId: string | null;
    wardId: string | null;
    resolvedAddress: string | null;
}

/**
 * Reverse-geocode coordinates using Nominatim and match against Appwrite location data.
 */
export async function assignLocationFromCoordinates(lat: number, lng: number): Promise<LocationResult> {
    const result: LocationResult = {
        stateId: null,
        cityId: null,
        villageId: null,
        wardId: null,
        resolvedAddress: null,
    };

    if (!lat || !lng) return result;

    try {
        // Step 1: Reverse geocode with Nominatim (free, no API key)
        const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
            {
                headers: {
                    'User-Agent': 'CivicShakti/1.0 (civic-complaint-platform)',
                    'Accept-Language': 'en',
                },
            }
        );

        if (!nominatimRes.ok) {
            console.warn('[Geofence] Nominatim reverse geocode failed:', nominatimRes.status);
            return result;
        }

        const geoData = await nominatimRes.json();
        const address = geoData.address || {};

        // Extract location names from Nominatim response
        const stateName = address.state || '';
        const cityName = address.city || address.town || address.county || '';
        const villageName = address.village || address.suburb || address.neighbourhood || '';
        const wardName = address.quarter || address.hamlet || '';
        result.resolvedAddress = geoData.display_name || null;

        // Step 2: Match against Appwrite location records (fuzzy, case-insensitive)
        if (stateName) {
            try {
                const states = await serverDatabases.listDocuments(DB_ID, 'states', [
                    Query.limit(100),
                ]);
                const match = states.documents.find(
                    s => s.name.toLowerCase() === stateName.toLowerCase() ||
                         stateName.toLowerCase().includes(s.name.toLowerCase())
                );
                if (match) result.stateId = match.$id;
            } catch { /* collection may not exist yet */ }
        }

        if (cityName && result.stateId) {
            try {
                const cities = await serverDatabases.listDocuments(DB_ID, 'cities', [
                    Query.equal('state_id', result.stateId),
                    Query.limit(100),
                ]);
                const match = cities.documents.find(
                    c => c.name.toLowerCase() === cityName.toLowerCase() ||
                         cityName.toLowerCase().includes(c.name.toLowerCase())
                );
                if (match) result.cityId = match.$id;
            } catch { /* skip */ }
        }

        if (villageName && result.cityId) {
            try {
                const villages = await serverDatabases.listDocuments(DB_ID, 'villages', [
                    Query.equal('city_id', result.cityId),
                    Query.limit(100),
                ]);
                const match = villages.documents.find(
                    v => v.name.toLowerCase() === villageName.toLowerCase() ||
                         villageName.toLowerCase().includes(v.name.toLowerCase())
                );
                if (match) result.villageId = match.$id;
            } catch { /* skip */ }
        }

        if (wardName && result.villageId) {
            try {
                const wards = await serverDatabases.listDocuments(DB_ID, 'wards', [
                    Query.equal('village_id', result.villageId),
                    Query.limit(100),
                ]);
                const match = wards.documents.find(
                    w => w.name.toLowerCase() === wardName.toLowerCase() ||
                         wardName.toLowerCase().includes(w.name.toLowerCase())
                );
                if (match) result.wardId = match.$id;
            } catch { /* skip */ }
        }

        console.log('[Geofence] Resolved:', {
            state: stateName, city: cityName, village: villageName, ward: wardName,
            matched: { stateId: result.stateId, cityId: result.cityId, villageId: result.villageId, wardId: result.wardId },
        });

    } catch (error) {
        console.error('[Geofence] Reverse geocode failed:', error);
    }

    return result;
}

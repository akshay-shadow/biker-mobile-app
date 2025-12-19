// Utility functions for calculating distances between coordinates

/**
 * Calculate the great circle distance between two points on Earth
 * using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse coordinates from PostGIS format to lat/lng
 * Supports formats: "(lng,lat)" or "POINT(lng lat)"
 */
export function parseCoordinates(coordinateString: string): { lat: number; lng: number } | null {
  if (!coordinateString) return null;
  
  try {
    // Handle PostGIS POINT format: "POINT(lng lat)"
    if (coordinateString.startsWith('POINT(')) {
      const coords = coordinateString.replace('POINT(', '').replace(')', '').split(' ');
      if (coords.length === 2) {
        return {
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1])
        };
      }
    }
    
    // Handle simple format: "(lng,lat)"
    if (coordinateString.startsWith('(') && coordinateString.endsWith(')')) {
      const coords = coordinateString.slice(1, -1).split(',');
      if (coords.length === 2) {
        return {
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1])
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return null;
  }
}

/**
 * Get coordinates for a city name (simplified lookup)
 * This is a basic implementation - in production, you'd use a geocoding service
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    // Major Indian cities
    'Mumbai, Maharashtra': { lat: 19.0760, lng: 72.8777 },
    'Delhi, Delhi': { lat: 28.6139, lng: 77.2090 },
    'Bangalore, Karnataka': { lat: 12.9716, lng: 77.5946 },
    'Hyderabad, Telangana': { lat: 17.3850, lng: 78.4867 },
    'Ahmedabad, Gujarat': { lat: 23.0225, lng: 72.5714 },
    'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
    'Kolkata, West Bengal': { lat: 22.5726, lng: 88.3639 },
    'Surat, Gujarat': { lat: 21.1702, lng: 72.8311 },
    'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
    'Jaipur, Rajasthan': { lat: 26.9124, lng: 75.7873 },
    'Lucknow, Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
    'Kanpur, Uttar Pradesh': { lat: 26.4499, lng: 80.3319 },
    'Nagpur, Maharashtra': { lat: 21.1458, lng: 79.0882 },
    'Indore, Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
    'Thane, Maharashtra': { lat: 19.2184, lng: 72.9781 },
    'Bhopal, Madhya Pradesh': { lat: 23.2599, lng: 77.4126 },
    'Visakhapatnam, Andhra Pradesh': { lat: 17.6868, lng: 83.2185 },
    'Pimpri-Chinchwad, Maharashtra': { lat: 18.6298, lng: 73.7997 },
    'Patna, Bihar': { lat: 25.5941, lng: 85.1376 },
    'Vadodara, Gujarat': { lat: 22.3072, lng: 73.1812 },
    'Ghaziabad, Uttar Pradesh': { lat: 28.6692, lng: 77.4538 },
    'Ludhiana, Punjab': { lat: 30.9010, lng: 75.8573 },
    'Agra, Uttar Pradesh': { lat: 27.1767, lng: 78.0081 },
    'Nashik, Maharashtra': { lat: 19.9975, lng: 73.7898 },
    'Faridabad, Haryana': { lat: 28.4089, lng: 77.3178 },
    'Meerut, Uttar Pradesh': { lat: 28.9845, lng: 77.7064 },
    'Rajkot, Gujarat': { lat: 22.3039, lng: 70.8022 },
    'Kalyan-Dombivali, Maharashtra': { lat: 19.2403, lng: 73.1305 },
    'Vasai-Virar, Maharashtra': { lat: 19.4910, lng: 72.8054 },
    'Varanasi, Uttar Pradesh': { lat: 25.3176, lng: 82.9739 },
    'Srinagar, Jammu and Kashmir': { lat: 34.0837, lng: 74.7973 },
    'Aurangabad, Maharashtra': { lat: 19.8762, lng: 75.3433 },
    'Dhanbad, Jharkhand': { lat: 23.7957, lng: 86.4304 },
    'Amritsar, Punjab': { lat: 31.6340, lng: 74.8723 },
    'Navi Mumbai, Maharashtra': { lat: 19.0330, lng: 73.0297 },
    'Allahabad, Uttar Pradesh': { lat: 25.4358, lng: 81.8463 },
    'Howrah, West Bengal': { lat: 22.5958, lng: 88.2636 },
    'Ranchi, Jharkhand': { lat: 23.3441, lng: 85.3096 },
    'Gwalior, Madhya Pradesh': { lat: 26.2183, lng: 78.1828 },
    'Jabalpur, Madhya Pradesh': { lat: 23.1815, lng: 79.9864 },
    'Coimbatore, Tamil Nadu': { lat: 11.0168, lng: 76.9558 },
    'Vijayawada, Andhra Pradesh': { lat: 16.5062, lng: 80.6480 },
    'Jodhpur, Rajasthan': { lat: 26.2389, lng: 73.0243 },
    'Madurai, Tamil Nadu': { lat: 9.9252, lng: 78.1198 },
    'Raipur, Chhattisgarh': { lat: 21.2514, lng: 81.6296 },
    'Kota, Rajasthan': { lat: 25.2138, lng: 75.8648 },
    'Chandigarh, Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Guwahati, Assam': { lat: 26.1445, lng: 91.7362 },
    'Solapur, Maharashtra': { lat: 17.6599, lng: 75.9064 },
    'Hubli-Dharwad, Karnataka': { lat: 15.3647, lng: 75.1240 },
    'Tiruchirappalli, Tamil Nadu': { lat: 10.7905, lng: 78.7047 },
    'Bareilly, Uttar Pradesh': { lat: 28.3670, lng: 79.4304 },
    'Mysore, Karnataka': { lat: 12.2958, lng: 76.6394 },
    'Tiruppur, Tamil Nadu': { lat: 11.1085, lng: 77.3411 },
    'Gurgaon, Haryana': { lat: 28.4595, lng: 77.0266 },
    'Aligarh, Uttar Pradesh': { lat: 27.8974, lng: 78.0880 },
    'Jalandhar, Punjab': { lat: 31.3260, lng: 75.5762 },
    'Bhubaneswar, Odisha': { lat: 20.2961, lng: 85.8245 },
    'Salem, Tamil Nadu': { lat: 11.6502, lng: 78.1460 },
    'Warangal, Telangana': { lat: 17.9689, lng: 79.5941 },
    'Guntur, Andhra Pradesh': { lat: 16.3067, lng: 80.4365 },
    'Bhiwandi, Maharashtra': { lat: 19.3002, lng: 73.0635 },
    'Saharanpur, Uttar Pradesh': { lat: 29.9680, lng: 77.5552 },  
    'Gorakhpur, Uttar Pradesh': { lat: 26.7606, lng: 83.3732 },
    'Bikaner, Rajasthan': { lat: 28.0229, lng: 73.3119 },
    'Amravati, Maharashtra': { lat: 20.9319, lng: 77.7523 },
    'Noida, Uttar Pradesh': { lat: 28.5355, lng: 77.3910 },
    'Jamshedpur, Jharkhand': { lat: 22.8046, lng: 86.2029 },
    'Bhilai, Chhattisgarh': { lat: 21.1938, lng: 81.3509 },
    'Cuttack, Odisha': { lat: 20.4625, lng: 85.8828 },
    'Firozabad, Uttar Pradesh': { lat: 27.1592, lng: 78.3957 },
    'Kochi, Kerala': { lat: 9.9312, lng: 76.2673 },
    'Nellore, Andhra Pradesh': { lat: 14.4426, lng: 79.9865 },
    'Bhavnagar, Gujarat': { lat: 21.7645, lng: 72.1519 },
    'Dehradun, Uttarakhand': { lat: 30.3165, lng: 78.0322 },
    'Durgapur, West Bengal': { lat: 23.5204, lng: 87.3119 },
    'Asansol, West Bengal': { lat: 23.6739, lng: 86.9524 },
    'Rourkela, Odisha': { lat: 22.2604, lng: 84.8536 },
    'Nanded, Maharashtra': { lat: 19.1383, lng: 77.3210 },
    'Kolhapur, Maharashtra': { lat: 16.7050, lng: 74.2433 },
    'Ajmer, Rajasthan': { lat: 26.4499, lng: 74.6399 },
    'Akola, Maharashtra': { lat: 20.7002, lng: 77.0082 },
    'Gulbarga, Karnataka': { lat: 17.3297, lng: 76.8343 },
    'Jamnagar, Gujarat': { lat: 22.4707, lng: 70.0577 },
    'Ujjain, Madhya Pradesh': { lat: 23.1765, lng: 75.7885 },
    'Loni, Uttar Pradesh': { lat: 28.7333, lng: 77.2167 },
    'Siliguri, West Bengal': { lat: 26.7271, lng: 88.3953 },
    'Jhansi, Uttar Pradesh': { lat: 25.4484, lng: 78.5685 },
    'Ulhasnagar, Maharashtra': { lat: 19.2215, lng: 73.1645 },
    'Jammu, Jammu and Kashmir': { lat: 32.7266, lng: 74.8570 },
    'Sangli-Miraj & Kupwad, Maharashtra': { lat: 16.8524, lng: 74.5815 },
    'Mangalore, Karnataka': { lat: 12.9141, lng: 74.8560 },
    'Erode, Tamil Nadu': { lat: 11.3410, lng: 77.7172 },
    'Belgaum, Karnataka': { lat: 15.8497, lng: 74.4977 },
    'Ambattur, Tamil Nadu': { lat: 13.1143, lng: 80.1548 },
    'Tirunelveli, Tamil Nadu': { lat: 8.7139, lng: 77.7567 },
    'Malegaon, Maharashtra': { lat: 20.5579, lng: 74.5287 },
    'Gaya, Bihar': { lat: 24.7914, lng: 85.0002 },
    'Jalgaon, Maharashtra': { lat: 21.0077, lng: 75.5626 },
    'Udaipur, Rajasthan': { lat: 24.5854, lng: 73.7125 },
    'Maheshtala, West Bengal': { lat: 22.5098, lng: 88.2476 },
    'Davanagere, Karnataka': { lat: 14.4644, lng: 75.9217 },
    'Kozhikode, Kerala': { lat: 11.2588, lng: 75.7804 },
  };

  return cityCoordinates[cityName] || null;
}

/**
 * Calculate distance between two cities by name
 */
export function calculateDistanceBetweenCities(startCity: string, endCity: string): number | null {
  const startCoords = getCityCoordinates(startCity);
  const endCoords = getCityCoordinates(endCity);
  
  if (!startCoords || !endCoords) {
    return null;
  }
  
  return calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
}
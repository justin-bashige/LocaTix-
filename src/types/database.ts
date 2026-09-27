export type UserRole = 'tenant' | 'owner' | 'admin';

export type PropertyType = 'appartement' | 'maison' | 'studio' | 'villa' | 'chambre';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseImage {
  id: string;
  house_id: string;
  image_url: string;
  created_at: string;
}

export interface House {
  id: string;
  owner_id: string;
  title: string;
  price: number;
  location: string;
  address: string | null;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  property_type: PropertyType;
  surface: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  images?: HouseImage[];
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export interface Favorite {
  id: string;
  user_id: string;
  house_id: string;
  created_at: string;
  house?: House;
}

export interface RentalRequest {
  id: string;
  house_id: string;
  tenant_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  house?: House;
  tenant?: Profile;
}

export interface SearchFilters {
  keyword?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number; // e.g. 1, 2, 3, 4+
  bathrooms?: number;
  propertyType?: PropertyType | '';
  minSurface?: number;
  maxSurface?: number;
  onlyAvailable?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'bedrooms_desc';
}

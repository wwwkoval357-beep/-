export interface TowOrder {
  id: string;
  orderNumber?: string;
  name: string;
  phone: string;
  city?: string;
  fromLocation: string;
  toLocation: string;
  vehicleType: string;
  hasLockedWheels: boolean;
  hasSteeringIssue: boolean;
  needsDitchPull: boolean;
  distance: number;
  estimatedPrice: number;
  status: 'pending' | 'searching' | 'dispatched' | 'completed';
  createdAt: string;
  etaMinutes: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  pricePerKm: number;
  iconName: string;
  details: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  city: string;
  text: string;
  rating: number;
  vehicle: string;
  date: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/api';

export type PackageCategory = 'student' | 'skilled' | 'family' | 'employer';

export interface ServicePackage {
  id: string;
  package_name: string;
  visa_subclass: string;
  category: PackageCategory;
  professional_fees: number;
  government_charges: number;
  estimated_extras: number;
  inclusions: string[];
  is_active: boolean;
  display_order: number;
}

export interface UserQuote {
  id: string;
  user_id: string;
  package_id: string;
  status: 'draft' | 'sent' | 'accepted' | 'expired';
  total_amount: number;
  custom_notes?: string;
  created_at: string;
  expires_at: string;
}

interface PackagesApiResponse {
  success: boolean;
  data: ServicePackage[];
}

interface QuoteApiResponse {
  success: boolean;
  data: UserQuote;
}

class PricingService {
  async getPackages(): Promise<ServicePackage[]> {
    const response = await apiClient.get<PackagesApiResponse | ServicePackage[]>(
      API_ENDPOINTS.GET_PRICING_PACKAGES,
    );
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as PackagesApiResponse).data;
    }
    return response as ServicePackage[];
  }

  async createQuote(packageId: string, customNotes?: string): Promise<UserQuote> {
    const response = await apiClient.post<QuoteApiResponse | UserQuote>(
      API_ENDPOINTS.CREATE_QUOTE,
      { package_id: packageId, custom_notes: customNotes },
    );
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as QuoteApiResponse).data;
    }
    return response as UserQuote;
  }
}

export const pricingService = new PricingService();

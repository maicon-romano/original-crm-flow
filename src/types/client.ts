
export interface Client {
  id: string;
  user_id?: string;
  // Person type
  person_type: "juridica" | "fisica";
  
  // Juridical person fields
  company_name?: string;
  legal_name?: string;
  fantasy_name?: string;
  tax_id?: string;
  state_registration?: string;
  municipal_registration?: string;
  
  // Physical person fields
  contact_name: string;
  cpf?: string;
  rg?: string;
  
  // Contact information
  email: string;
  phone?: string;
  responsible_name?: string;
  responsible_position?: string;
  
  // Address
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Internal organization
  status: string;
  client_source?: string;
  plan?: string;
  notes?: string;
  
  // Social media and links
  instagram?: string;
  website?: string;
  whatsapp_link?: string;
  other_social_media?: Record<string, string>;
  
  // Services flags
  social_media?: boolean;
  paid_traffic?: boolean;
  website_development?: boolean;
  
  // Contract
  contract_value?: number;
  contract_start?: string;
  contract_end?: string;
  
  // CRM access
  send_email_invite?: boolean;
  send_whatsapp_invite?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Google Drive
  drive_folder_id?: string;
}

// Type for client insertion without ID and timestamps
export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'> & {
  company_name: string; // Making sure company_name is required for database insertion
};


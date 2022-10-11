export interface EnsDomainModel {
  id?: string;
  labelhash?: string;
  labelName?: string;
  name?: string;
  subdomainCount?: number;
  resolvedAddress?: string;
  createdAt?: number;
  subdomains?: { id?: string; labelhash?: string; labelName?: string }[];
  registrations?: {
    id?: string;
    registrationDate?: number;
    expiryDate?: number;
    registrant?: string;
    labelName?: string;
  };
}

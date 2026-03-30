export interface CompanyType {
  id: number;
  companyName: string;
  jobTitle: string;
  isCurrentCompany: true;
}

export type UserType = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  companies: CompanyType[];
  role: string;
  coverPicture?: string | null;
  profilePicture?: string | null;
  hasJuryExperience: boolean;
};


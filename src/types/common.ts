export type OptionType = Array<{
  label: string;
  value: string;
  icon?: any;
  id: string | number;
  [key: string]: any;
}>;

export type VideoCard = {
  title: string;
  brandName: string;
  publishDate: string; // ISO format: YYYY-MM-DD
  uploadedDate: string | null;
  thumbnail: string | null; // URL or null
};

export type VideoList = VideoCard[];

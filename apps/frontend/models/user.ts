import { News } from "./news";

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  photo?: string;
  motto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserProfile extends User {
  news: News[];
}

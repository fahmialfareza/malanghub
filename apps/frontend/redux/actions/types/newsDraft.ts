export interface CreateUpdateNewsDraft {
  title: string;
  category: string;
  mainImage?: Blob;
  mainImageName?: string;
  content: string;
  tags: string;
}

export interface UpdateNewsDraftApproved {
  title: string;
  content: string;
  message: string;
  approved: boolean;
}

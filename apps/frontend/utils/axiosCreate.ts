import axios from "axios";

export const request = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ADDRESS,
});

export const setAuthToken = (token: string) => {
  if (token) {
    request.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete request.defaults.headers.common["Authorization"];
  }
};

// TinyMCE `images_upload_handler`: /api/upload requires the bearer token,
// which TinyMCE's built-in `images_upload_url` uploader cannot send.
export const uploadEditorImage = async (blobInfo: {
  blob(): Blob;
  filename(): string;
}): Promise<string> => {
  const formData = new FormData();
  formData.append("file", blobInfo.blob(), blobInfo.filename());

  const token = localStorage.getItem("token");
  const res = await request.post<{ location: string }>("/api/upload", formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return res.data.location;
};

package cloudinarypkg

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"os"

	cloudinary "github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// Init initializes a Cloudinary client from environment variables.
// It prefers CLOUDINARY_URL, but falls back to CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
func Init() (*cloudinary.Cloudinary, error) {
	// If CLOUDINARY_URL is set, NewFromURL will parse it.
	url := os.Getenv("CLOUDINARY_URL")
	if url != "" {
		cld, err := cloudinary.NewFromURL(url)
		if err != nil {
			return nil, err
		}
		return cld, nil
	}

	// Fallback to components
	name := os.Getenv("CLOUDINARY_CLOUD_NAME")
	key := os.Getenv("CLOUDINARY_API_KEY")
	secret := os.Getenv("CLOUDINARY_API_SECRET")
	if name == "" || key == "" || secret == "" {
		// Not configured
		return nil, nil
	}
	url = fmt.Sprintf("cloudinary://%s:%s@%s", key, secret, name)
	cld, err := cloudinary.NewFromURL(url)
	if err != nil {
		return nil, err
	}
	return cld, nil
}

// UploadFileHeader uploads the provided multipart file header to Cloudinary.
// It writes the file to a temporary path and uploads from there.
func UploadFileHeader(ctx context.Context, cld *cloudinary.Cloudinary, fh *multipart.FileHeader, folder string, publicID string) (string, error) {
	if cld == nil {
		return "", fmt.Errorf("cloudinary not configured")
	}
	// Open the uploaded file
	f, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()

	// Create temp file
	tmp, err := ioutil.TempFile("", "upload-*")
	if err != nil {
		return "", err
	}
	defer func() {
		tmp.Close()
		os.Remove(tmp.Name())
	}()

	// Copy to temp file
	if _, err := io.Copy(tmp, f); err != nil {
		return "", err
	}

	// Upload from temp path
	params := uploader.UploadParams{}
	if folder != "" {
		params.Folder = folder
	}
	if publicID != "" {
		params.PublicID = publicID
	}
	resp, err := cld.Upload.Upload(ctx, tmp.Name(), params)
	if err != nil {
		return "", err
	}
	return resp.SecureURL, nil
}

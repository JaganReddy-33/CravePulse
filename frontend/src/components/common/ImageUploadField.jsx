import React, { useState } from "react";
import api from "../../services/api";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploadField({
  id,
  label,
  purpose,
  value,
  onChange,
  onUploadingChange,
  allowClear = true,
  allowUrl = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Choose an image that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const response = await api.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!response.success || !response.data?.imageUrl) {
        throw new Error(response.message || "Image upload did not complete.");
      }
      onChange(response.data.imageUrl);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload this image.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="form-control"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
        disabled={uploading}
      />
      <div className="form-text">JPEG, PNG, or WebP; maximum 5 MB.</div>
      {allowUrl && (
        <div className="mt-3">
          <label className="form-label small" htmlFor={`${id}-url`}>
            Or paste an image URL
          </label>
          <input
            id={`${id}-url`}
            className="form-control"
            type="url"
            inputMode="url"
            autoComplete="url"
            maxLength={500}
            pattern="https://.+"
            title="Enter a valid HTTPS image URL."
            placeholder="https://example.com/image.jpg"
            value={value || ""}
            onChange={(event) => {
              setError("");
              onChange(event.target.value);
            }}
            disabled={uploading}
          />
          <div className="form-text">
            Use a direct HTTPS link to an image; a Google Maps place link is not an image URL.
          </div>
        </div>
      )}
      {uploading && (
        <p className="small text-secondary mt-2 mb-0" role="status">
          Uploading image…
        </p>
      )}
      {error && (
        <p className="small text-danger mt-2 mb-0" role="alert">
          {error}
        </p>
      )}
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt={`${label} preview`}
            className="rounded object-fit-cover border"
            style={{ maxWidth: 160, maxHeight: 100 }}
          />
          {allowClear && (
            <button
              type="button"
              className="btn btn-sm btn-link d-block px-0"
              onClick={() => onChange("")}
            >
              Remove image
            </button>
          )}
        </div>
      )}
    </div>
  );
}

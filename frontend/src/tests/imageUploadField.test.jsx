import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import ImageUploadField from "../components/common/ImageUploadField";

vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("ImageUploadField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a selected image and returns its stored URL", async () => {
    api.post.mockResolvedValue({
      success: true,
      data: { imageUrl: "https://res.cloudinary.com/demo/image/upload/photo.webp" },
    });
    const onChange = vi.fn();
    render(
      <ImageUploadField
        id="avatar"
        label="Profile photo"
        purpose="avatar"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Profile photo"), {
      target: {
        files: [new File(["image"], "photo.webp", { type: "image/webp" })],
      },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        "https://res.cloudinary.com/demo/image/upload/photo.webp",
      ),
    );
    expect(api.post).toHaveBeenCalledOnce();
    expect(api.post.mock.calls[0][0]).toBe("/uploads/images");
    const formData = api.post.mock.calls[0][1];
    expect(formData.get("purpose")).toBe("avatar");
    expect(formData.get("file").name).toBe("photo.webp");
  });

  it("rejects files that are not in the supported image formats", async () => {
    const onChange = vi.fn();
    render(
      <ImageUploadField
        id="avatar"
        label="Profile photo"
        purpose="avatar"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Profile photo"), {
      target: {
        files: [new File(["not an image"], "notes.txt", { type: "text/plain" })],
      },
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Choose a JPEG, PNG, or WebP image.");
    expect(api.post).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

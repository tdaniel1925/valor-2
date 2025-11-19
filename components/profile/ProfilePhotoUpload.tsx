"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth/supabase-client";

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string | null;
  onUploadComplete?: (url: string) => void;
}

export default function ProfilePhotoUpload({
  userId,
  currentPhotoUrl,
  onUploadComplete,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const supabase = createClient();

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setPhotoUrl(data.publicUrl);
      if (onUploadComplete) {
        onUploadComplete(data.publicUrl);
      }

      // Update user profile with new photo URL
      await fetch("/api/profile/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: data.publicUrl }),
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Error uploading photo!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      {/* Photo Preview */}
      <div className="relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <label
          htmlFor="photo-upload"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {uploading ? "Uploading..." : "Upload Photo"}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={uploadPhoto}
          disabled={uploading}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { updateUser } from "@/lib/auth-client";
import Image from "next/image";
import { Pencil, X, Check, Trash2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ChangePasswordForm } from "./change-password-form";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface UpdateUserFormProps {
  user: User;
}

const ALLOWED_FILE_TYPES = ["image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const UpdateUserForm = ({ user }: UpdateUserFormProps) => {
  const [isPending, setIsPending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user.image);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(
          `File type not supported. Please upload: ${ALLOWED_FILE_TYPES.map((t) => t.split("/")[1]).join(", ")}`
        );
        return;
      }

      // Validasi ukuran file
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        handleUpdate({ imageFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async () => {
    setIsPending(true);
    try {
      await updateUser({
        image: null,
        fetchOptions: {
          onRequest: () => setIsPending(true),
          onResponse: () => setIsPending(false),
          onError: (ctx) => {
            toast.error(ctx.error?.message || "Delete failed");
          },
          onSuccess: () => {
            setPreviewImage(null);
            toast.success("Profile photo removed");
            window.location.reload();
          },
        },
      });
    } catch (error) {
      setIsPending(false);
      toast.error("Failed to delete photo");
      console.error("Delete error:", error);
    }
  };

  const toggleNameEdit = () => {
    setIsEditingName(!isEditingName);
    if (!isEditingName) {
      setTempName(user.name || "");
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  };

  const cancelNameEdit = () => {
    setIsEditingName(false);
    setTempName(user.name || "");
  };

  const saveNameEdit = async () => {
    if (tempName.trim() === user.name) {
      cancelNameEdit();
      return;
    }

    await handleUpdate({ name: tempName });
    setIsEditingName(false);
  };

  const handleUpdate = async ({
    name,
    imageFile,
  }: {
    name?: string;
    imageFile?: File;
  }) => {
    setIsPending(true);

    try {
      let imageUrl = user.image;

      if (imageFile) {
        const uploadResponse = await uploadImageToServer(imageFile, user.id);
        imageUrl = uploadResponse.url;
      }

      await updateUser({
        ...(name && { name }),
        ...(imageUrl && { image: imageUrl }),
        fetchOptions: {
          onRequest: () => setIsPending(true),
          onResponse: () => setIsPending(false),
          onError: (ctx) => {
            toast.error(ctx.error?.message || "Update failed");
          },
          onSuccess: () => {
            toast.success("Profile updated successfully");
            window.location.reload();
          },
        },
      });
    } catch (error) {
      setIsPending(false);
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    }
  };

  async function uploadImageToServer(
    file: File,
    userId: string
  ): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  return (
    <div className='space-y-6 w-full max-w-lg'>
      <h2 className='text-2xl font-bold'>Account Information</h2>

      <div className='space-y-6'>
        {/* Profile Photo Section */}
        <div className='flex items-center gap-4'>
          <div className='relative group'>
            <div className='relative w-24 h-24 rounded-full overflow-hidden border-2'>
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt='Profile'
                  fill
                  className='object-cover'
                  sizes='96px'
                />
              ) : (
                <div className='w-full h-full bg-radial-[at_25%_25%] from-indigo-50 to-indigo-800 to-75%  flex items-center justify-center text-3xl font-bold'>
                  {user.name?.substring(0, 2).toUpperCase() || "AA"}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='absolute bottom-0 right-0 rounded-full p-2 bg-zinc-300 text-black shadow-sm hover:bg-zinc-400 transition-colors ring-0'
                >
                  <Pencil className='h-4 w-4' />
                  <span className='sr-only'>Profile photo options</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-48'>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='cursor-pointer flex gap-2 items-center px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full hover:rounded-sm '
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  <span className='text-sm'>Change Photo</span>
                  <Input
                    type='file'
                    name='image'
                    accept={ALLOWED_FILE_TYPES.join(",")}
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className='hidden'
                  />
                </button>
                {previewImage && (
                  <DropdownMenuItem
                    onClick={handleDeletePhoto}
                    className='cursor-pointer text-red-600 hover:text-red-700'
                    disabled={isPending}
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    <span>Remove Photo</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <Label>Profile Photo</Label>
            <p className='text-sm text-muted-foreground mt-2'>
              Allowed types:{" "}
              {ALLOWED_FILE_TYPES.map((t) => t.split("/")[1]).join(" / ")} (Max{" "}
              {MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>
          </div>
        </div>

        {/* Name Section */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='name'>Name</Label>
            {!isEditingName ? (
              <Button
                variant='ghost'
                size='icon'
                type='button'
                onClick={toggleNameEdit}
                className='h-8 w-8'
              >
                <Pencil className='h-4 w-4' />
                <span className='sr-only'>Edit name</span>
              </Button>
            ) : (
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  type='button'
                  onClick={saveNameEdit}
                  disabled={isPending}
                  className='h-8 w-8 text-green-600 hover:text-green-700'
                >
                  <Check className='h-4 w-4' />
                  <span className='sr-only'>Save name</span>
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  type='button'
                  onClick={cancelNameEdit}
                  className='h-8 w-8 text-red-600 hover:text-red-700'
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Cancel edit</span>
                </Button>
              </div>
            )}
          </div>
          {isEditingName ? (
            <Input
              type='text'
              name='name'
              id='name'
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              ref={nameInputRef}
              disabled={isPending}
            />
          ) : (
            <div className='rounded-md border px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400'>
              {user?.name || "No name provided"}
            </div>
          )}
        </div>

        {/* Email Section (non-editable) */}
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <div className='rounded-md border px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400'>
            {user?.email || "No email provided"}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline'>Change password</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Make changes to your password here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <ChangePasswordForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

"use client";

import Image from "@/lib/browser/image";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import UploadIcon from "../../components/shape/upload";
import { FieldError, Loader, Text } from "rizzui";
import cn from "../../utils/class-names";
import { PiPencilSimple } from "react-icons/pi";
import { LoadingSpinner } from "../../ui/file-upload/upload-zone";
import { FileWithPath } from "react-dropzone";

interface UploadZoneProps {
  name: string;
  getValues?: any;
  setValue?: any;
  className?: string;
  error?: string;
}

export default function AvatarUpload({
  name,
  error,
  className,
  getValues,
  setValue,
}: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const formValue = getValues(name);

  const [isUploading, setIsUploading] = useState(false);

  function startUpload(selectedFiles: FileWithPath[]) {
    const file = selectedFiles[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setValue?.(name, {
        name: file.name,
        size: file.size,
        url:
          (file as FileWithPath & { preview?: string }).preview ||
          URL.createObjectURL(file),
      });
      setIsUploading(false);
      toast.success(
        <Text
          as="b"
          className="font-semibold"
        >
          Avatar added locally
        </Text>
      );
    }, 300);
  }

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFiles([
        ...acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        ),
      ]);
      startUpload(acceptedFiles);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  return (
    <div className={cn("grid gap-5", className)}>
      <div
        className={cn("relative grid h-40 w-40 place-content-center rounded-full border-[1.8px]")}
      >
        {formValue ? (
          <>
            <figure className="absolute inset-0 rounded-full">
              <Image
                fill
                alt="user avatar"
                src={formValue?.url}
                className="rounded-full"
              />
            </figure>
            <div
              {...getRootProps()}
              className={cn("absolute inset-0 grid place-content-center rounded-full bg-black/70")}
            >
              {isUploading ? <LoadingSpinner /> : <PiPencilSimple className="h-5 w-5 text-white" />}

              <input {...getInputProps()} />
            </div>
          </>
        ) : (
          <div
            {...getRootProps()}
            className={cn("absolute inset-0 z-10 grid cursor-pointer place-content-center")}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto h-12 w-12" />

            {isUploading ? (
              <Loader
                variant="spinner"
                className="justify-center"
              />
            ) : (
              <Text className="font-medium">Drop or select file</Text>
            )}
          </div>
        )}
      </div>
      {error && <FieldError error={error} />}
    </div>
  );
}

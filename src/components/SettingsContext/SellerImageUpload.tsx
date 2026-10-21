import { useEffect, useState } from 'react';
import { IconExclamationCircle } from '@tabler/icons-react';
import { Alert, Button, FileButton, Image } from '@mantine/core';

interface SellerImageUploadProps {
  image?: Uint8Array | null;
  label: string;
  errorTitle: string;
  disabled: boolean;
  previewWidth: number;
  onUpload: (file: File) => Promise<void>;
}

export function SellerImageUpload({
  image,
  label,
  errorTitle,
  disabled,
  previewWidth,
  onUpload,
}: SellerImageUploadProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    if (!image?.length) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(new Blob([new Uint8Array(image)], { type: 'image/png' }));
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return (
    <>
      <FileButton
        disabled={disabled || processing}
        onChange={async (file) => {
          if (!file) {
            return;
          }
          setError(null);
          setProcessing(true);
          try {
            await onUpload(file);
          } catch (uploadError) {
            setError(String(uploadError));
          } finally {
            setProcessing(false);
          }
        }}
        accept="image/png,image/jpeg"
      >
        {(props) => (
          <Button disabled={disabled || processing} loading={processing} {...props}>
            {label}
          </Button>
        )}
      </FileButton>
      {error && (
        <Alert color="red" title={errorTitle} icon={<IconExclamationCircle />}>
          {error}
        </Alert>
      )}
      {preview && <Image w={previewWidth} src={preview} alt={label} />}
    </>
  );
}

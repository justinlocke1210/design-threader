import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DesignImage {
  id: string;
  design_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

interface DesignImageUploadProps {
  designId: string;
}

export default function DesignImageUpload({ designId }: DesignImageUploadProps) {
  const [images, setImages] = useState<DesignImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('design_images')
      .select('*')
      .eq('design_id', designId)
      .order('created_at', { ascending: true });
    if (!error && data) setImages(data as DesignImage[]);
  };

  useEffect(() => {
    fetchImages();
  }, [designId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`);
          continue;
        }

        const ext = file.name.split('.').pop();
        const path = `${designId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('design-images')
          .upload(path, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('design-images')
          .getPublicUrl(path);

        await supabase.from('design_images').insert({
          design_id: designId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        });
      }
      await fetchImages();
      toast.success('Images uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async (image: DesignImage) => {
    // Extract storage path from URL
    const urlParts = image.file_url.split('/design-images/');
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from('design-images').remove([storagePath]);
    }
    await supabase.from('design_images').delete().eq('id', image.id);
    setImages(prev => prev.filter(i => i.id !== image.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Uploading...' : 'Add Images'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(img)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

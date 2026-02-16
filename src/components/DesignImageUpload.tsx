import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImagePlus, X, Loader2, FileText, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  /** If true, only show thumbnail previews (no upload/remove controls) */
  previewOnly?: boolean;
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

function isPdf(fileName: string) {
  return fileName.toLowerCase().endsWith('.pdf');
}

export default function DesignImageUpload({ designId, previewOnly = false }: DesignImageUploadProps) {
  const [images, setImages] = useState<DesignImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState('');
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
      toast.success('Files uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async (image: DesignImage) => {
    const urlParts = image.file_url.split('/design-images/');
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from('design-images').remove([storagePath]);
    }
    await supabase.from('design_images').delete().eq('id', image.id);
    setImages(prev => prev.filter(i => i.id !== image.id));
  };

  const openLightbox = (img: DesignImage) => {
    if (isPdf(img.file_name)) {
      // Open PDFs in new tab since they can't be shown in an img tag
      window.open(img.file_url, '_blank');
    } else {
      setLightboxUrl(img.file_url);
      setLightboxName(img.file_name);
    }
  };

  if (images.length === 0 && previewOnly) return null;

  // Preview-only mode: compact thumbnails for the collapsed row
  if (previewOnly) {
    return (
      <>
        <div className="flex -space-x-1" onClick={e => e.stopPropagation()}>
          {images.slice(0, 3).map(img => (
            <button
              key={img.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); openLightbox(img); }}
              className="w-8 h-8 rounded-md overflow-hidden border-2 border-card shrink-0 hover:ring-2 hover:ring-ring transition-all"
            >
              {isPdf(img.file_name) ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <FileText size={14} className="text-muted-foreground" />
                </div>
              ) : (
                <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
          {images.length > 3 && (
            <div className="w-8 h-8 rounded-md border-2 border-card bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              +{images.length - 3}
            </div>
          )}
        </div>

        <Dialog open={!!lightboxUrl} onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] p-2">
            <div className="flex items-center justify-center min-h-[300px]">
              {lightboxUrl && (
                <img src={lightboxUrl} alt={lightboxName} className="max-w-full max-h-[80vh] object-contain rounded" />
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">{lightboxName}</p>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full mode with upload/remove controls
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
          {uploading ? 'Uploading...' : 'Add Files'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">{images.length} file{images.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              {isPdf(img.file_name) ? (
                <button
                  type="button"
                  onClick={() => openLightbox(img)}
                  className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
                >
                  <FileText size={20} className="text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground truncate max-w-[70px] px-1">{img.file_name}</span>
                </button>
              ) : (
                <>
                  <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => openLightbox(img)}
                    className="absolute inset-0 flex items-center justify-center bg-background/0 hover:bg-background/40 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Maximize2 size={16} className="text-foreground" />
                  </button>
                </>
              )}
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

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-2">
          <div className="flex items-center justify-center min-h-[300px]">
            {lightboxUrl && (
              <img src={lightboxUrl} alt={lightboxName} className="max-w-full max-h-[80vh] object-contain rounded" />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">{lightboxName}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

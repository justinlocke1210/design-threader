import { useEffect, useState } from "react";
import { FileText, ImagePlus, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DesignImage {
  id: string;
  design_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  file_path?: string;
}

interface DesignImageUploadProps {
  designId: string;
  previewOnly?: boolean;
}

function isPdf(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf");
}

export default function DesignImageUpload({ designId, previewOnly = false }: DesignImageUploadProps) {
  const [images, setImages] = useState<DesignImage[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState("");

  const fetchImages = async () => {
    try {
      if (!window.desktopAPI) {
        setImages([]);
        return;
      }
      const data = await window.desktopAPI.listDesignFileReferences(designId);
      setImages(data as DesignImage[]);
    } catch {
      toast.error("Failed to load file references");
    }
  };

  useEffect(() => {
    fetchImages();
  }, [designId]);

  const handleAddFiles = async () => {
    try {
      if (!window.desktopAPI) {
        toast.error("Desktop API not available");
        return;
      }

      await window.desktopAPI.selectDesignFiles(designId);
      await fetchImages();
      toast.success("File references added");
    } catch {
      toast.error("Failed to add files");
    }
  };

  const handleRemove = async (image: DesignImage) => {
    try {
      if (!window.desktopAPI) return;
      await window.desktopAPI.removeDesignFileReference(designId, image.id);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
      toast.success("Reference removed");
    } catch {
      toast.error("Failed to remove reference");
    }
  };

  const openLightbox = async (img: DesignImage) => {
    if (isPdf(img.file_name)) {
      if (img.file_path && window.desktopAPI) {
        await window.desktopAPI.openDesignFile(img.file_path);
      }
      return;
    }

    setLightboxUrl(img.file_url);
    setLightboxName(img.file_name);
  };

  if (images.length === 0 && previewOnly) return null;

  if (previewOnly) {
    return (
      <>
        <div className="flex -space-x-1" onClick={(e) => e.stopPropagation()}>
          {images.slice(0, 3).map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(img);
              }}
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddFiles}
          className="gap-1.5"
        >
          <ImagePlus size={14} />
          Add Files
        </Button>

        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {images.length} file{images.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              {isPdf(img.file_name) ? (
                <button
                  type="button"
                  onClick={() => openLightbox(img)}
                  className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
                >
                  <FileText size={20} className="text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground truncate max-w-[70px] px-1">
                    {img.file_name}
                  </span>
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
                type="button"
                onClick={() => handleRemove(img)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove reference only"
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

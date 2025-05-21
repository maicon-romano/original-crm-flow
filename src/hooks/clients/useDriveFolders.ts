
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DriveFolderResponse {
  folders: DriveFolder[];
  count: number;
}

export const useDriveFolders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const hasFetched = useRef<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const listFolders = async (folderId: string) => {
    // Reset error state
    setError(null);
    
    // Prevent duplicate fetches for the same folder ID
    if (hasFetched.current[folderId]) {
      console.log(`Already fetched folders for ID: ${folderId}, using cached results`);
      return folders;
    }

    try {
      setIsLoading(true);
      console.log(`Listing folders for Drive folder ID: ${folderId}`);
      
      const { data, error } = await supabase.functions.invoke<DriveFolderResponse>('list-drive-folders', {
        body: { folderId }
      });
      
      if (error) {
        console.error("Error listing Drive folders:", error);
        setError(error.message || "Erro ao listar pastas do Google Drive");
        throw new Error(error.message || "Erro ao listar pastas do Google Drive");
      }
      
      if (data?.folders) {
        console.log(`Fetched ${data.folders.length} folders`);
        setFolders(data.folders);
        
        // Mark this folder ID as fetched
        hasFetched.current[folderId] = true;
        return data.folders;
      }
      
      return [];
    } catch (error: any) {
      console.error("Exception listing Drive folders:", error);
      setError(error.message || "Erro ao listar pastas do Google Drive");
      throw new Error(error.message || "Erro ao listar pastas do Google Drive");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = (folderId?: string) => {
    if (folderId) {
      // Clear cache for specific folder
      delete hasFetched.current[folderId];
    } else {
      // Clear entire cache
      hasFetched.current = {};
    }
    setError(null);
  };

  return {
    listFolders,
    folders,
    isLoading,
    clearCache,
    error
  };
};

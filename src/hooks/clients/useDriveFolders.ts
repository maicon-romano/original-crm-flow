
import { useState } from "react";
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

  const listFolders = async (folderId: string) => {
    try {
      setIsLoading(true);
      console.log(`Listing folders for Drive folder ID: ${folderId}`);
      
      const { data, error } = await supabase.functions.invoke<DriveFolderResponse>('list-drive-folders', {
        body: { folderId }
      });
      
      if (error) {
        console.error("Error listing Drive folders:", error);
        throw new Error(error.message || "Erro ao listar pastas do Google Drive");
      }
      
      if (data?.folders) {
        setFolders(data.folders);
        return data.folders;
      }
      
      return [];
    } catch (error: any) {
      console.error("Exception listing Drive folders:", error);
      throw new Error(error.message || "Erro ao listar pastas do Google Drive");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listFolders,
    folders,
    isLoading
  };
};

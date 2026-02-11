import { ImportModal as DesarquivamentosImportModal } from "@/components/desarquivamentos/ImportModal";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal = (props: ImportModalProps) => {
  return <DesarquivamentosImportModal {...props} />;
};

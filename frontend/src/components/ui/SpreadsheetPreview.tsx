import React from "react";
import { cn } from "@/utils/cn";

export type SheetRow = Record<string, unknown>;
export type SheetData = SheetRow[];

interface SpreadsheetPreviewProps {
  headers: string[];
  data: SheetData;
  className?: string;
  maxHeight?: string;
  showRowNumbers?: boolean;
}

export const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({
  headers,
  data,
  className,
  maxHeight = "max-h-[400px]",
  showRowNumbers = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum dado para exibir
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className={cn("w-full overflow-auto", maxHeight)}>
        <div className="relative min-w-max">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b">
              <tr>
                {showRowNumbers && (
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 min-w-[60px]">
                    #
                  </th>
                )}
                {headers.map((header, index) => (
                  <th
                    key={`header-${index}`}
                    className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 min-w-[120px] whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className={cn(
                    "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    rowIndex % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50/50 dark:bg-gray-800/30",
                  )}
                >
                  {showRowNumbers && (
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 font-mono text-xs">
                      {rowIndex + 1}
                    </td>
                  )}
                  {headers.map((header, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${colIndex}-${header}`}
                      className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-[200px] truncate"
                      title={String(row[header])}
                    >
                      {row[header] !== null && row[header] !== undefined
                        ? String(row[header])
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t text-xs text-gray-500 dark:text-gray-400">
        Exibindo {data.length} linha(s) com {headers.length} coluna(s)
      </div>
    </div>
  );
};

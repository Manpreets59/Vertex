import { FileSystemTree } from "@webcontainer/api";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

type FileDoc = Doc<"files">;

/**
 * Build parent chain path from file traversing up the hierarchy
 */
const getParentPath = (file: FileDoc, filesMap: Map<Id<"files">, FileDoc>): string[] => {
  const parts: string[] = [file.name];
  let parentId = file.parentId;

  while (parentId) {
    const parent = filesMap.get(parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    parentId = parent.parentId;
  }

  return parts;
};

/**
 * Convert flat Convex files to nested FileSystemTree for WebContainer
 */
export const buildFileTree = (files: FileDoc[]): FileSystemTree => {
  const tree: FileSystemTree = {};
  const filesMap = new Map(files.map((f) => [f._id, f]));

  let filesAdded = 0;
  let filesSkipped = 0;

  for (const file of files) {
    const pathParts = getParentPath(file, filesMap);
    let current = tree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        if (file.type === "folder") {
          current[part] = { directory: {} };
          filesAdded++;
        } else if (file.content !== undefined) {
          current[part] = { file: { contents: file.content } };
          filesAdded++;
        } else if (file.storageId) {
          // Binary files with storageId can't be mounted directly in WebContainer
          console.warn("[FileTree] Skipping binary file (WebContainer limitation)", {
            name: file.name,
            path: pathParts.join("/"),
            storageId: file.storageId,
          });
          filesSkipped++;
        } else {
          console.warn("[FileTree] Skipping file with no content", {
            name: file.name,
            path: pathParts.join("/"),
          });
          filesSkipped++;
        }
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ("directory" in node) {
          current = node.directory;
        } else {
          // Skip if path is blocked by a file node
          console.warn("[FileTree] Path blocked by file node", {
            blockedPath: pathParts.slice(0, i + 1).join("/"),
          });
          break;
        }
      }
    }
  }

  console.log("[FileTree] Build complete", {
    totalFiles: files.length,
    filesAdded,
    filesSkipped,
    rootKeys: Object.keys(tree),
  });

  return tree;
};

/**
 * Get full path for a file by traversing parent chain
 */
export const getFilePath = (
  file: FileDoc,
  filesMap: Map<Id<"files">, FileDoc>
): string => {
  const parts = getParentPath(file, filesMap);
  return parts.join("/");
};
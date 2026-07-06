/**
 * File and URL helpers for loading log data
 */

/**
 * Read a File object as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Fetch text content from a URL
 */
export async function fetchTextContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Fetch file list from GitHub API
 */
export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

export async function fetchGitHubDirectory(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub directory: ${response.status}`);
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Parse GitHub repo URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Supports:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  
  const httpsMatch = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }
  
  const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\.]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }
  
  return null;
}

/**
 * Download a string as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format duration between two ISO timestamps
 */
export function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format a date for display
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString("vi-VN");
}

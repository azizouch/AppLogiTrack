import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (full.endsWith('.tsx')) files.push(full);
  }
  return files;
}

const root = path.join(process.cwd(), 'src');
const files = walk(root);

// 1) Convert Statuts.tsx native table to UI table components
const statutsPath = path.join(process.cwd(), 'src', 'pages', 'parametres', 'Statuts.tsx');
let statuts = fs.readFileSync(statutsPath, 'utf8');

if (!statuts.includes("@/components/ui/table")) {
  statuts = statuts.replace(
    "import { TablePagination } from '@/components/ui/table-pagination';\n",
    "import { TablePagination } from '@/components/ui/table-pagination';\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';\n"
  );
}

const replacements = [
  ['<table className="w-full min-w-[600px]">', '<Table className="w-full min-w-[600px]">'],
  ['</table>', '</Table>'],
  ['<thead>', '<TableHeader>'],
  ['</thead>', '</TableHeader>'],
  ['<tbody className="divide-y divide-gray-200 dark:divide-gray-700">', '<TableBody className="divide-y divide-gray-200 dark:divide-gray-700">'],
  ['</tbody>', '</TableBody>'],
  ['<tr className="border-b border-gray-200 bg-gray-50 dark:bg-gray-800">', '<TableRow className="bg-gray-200 dark:bg-gray-800">'],
  ['<tr key={statut.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-transparent">', '<TableRow key={statut.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-transparent">'],
  ['<tr>', '<TableRow>'],
  ['</tr>', '</TableRow>'],
  ['<th className="font-medium">', '<TableHead className="font-medium">'],
  ['</th>', '</TableHead>'],
  ['<td className="p-4">', '<TableCell className="p-4">'],
  ['<td className="p-4 capitalize text-sm text-gray-700 dark:text-gray-300">', '<TableCell className="p-4 capitalize text-sm text-gray-700 dark:text-gray-300">'],
  ['<td className="p-4 text-sm text-gray-700 dark:text-gray-300">', '<TableCell className="p-4 text-sm text-gray-700 dark:text-gray-300">'],
  ['<td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">', '<TableCell colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">'],
  ['</td>', '</TableCell>'],
];

for (const [from, to] of replacements) {
  statuts = statuts.split(from).join(to);
}

fs.writeFileSync(statutsPath, statuts, 'utf8');

// 2) Update all TableHeader -> TableRow class names
const headerRowRegex = /(<TableHeader>\s*\n\s*<TableRow className=")([^"]*)(")/g;
let changedCount = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const out = src.replace(headerRowRegex, (_, p1, cls, p3) => {
    let c = cls.replace(/border-b border-gray-200/g, '');
    c = c.replace(/bg-gray-50/g, 'bg-gray-200');
    c = c.replace(/\s+/g, ' ').trim();
    return `${p1}${c}${p3}`;
  });

  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    changedCount++;
  }
}

console.log(`Updated ${changedCount} files`);
